import { GoogleGenAI } from '@google/genai';
import { SkillGapAnalysisRequest, SkillGapAnalysisResponse, SkillGapAnalysisResponseSchema } from '@app/shared';
import { stripMarkdownCodeBlocks } from './utils.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

export const skillGapService = {
  async analyzeSkillGaps(request: SkillGapAnalysisRequest): Promise<SkillGapAnalysisResponse> {
    const SYSTEM_PROMPT = `You are a Resume Auditor Agent. Your task is to analyze a resume against a job description and identify skill gaps.

**Input:**
1. \`ResumeProfile\` (JSON object following ResumeProfile schema)
2. \`JobDescription\` (Text)

**Analysis Criteria:**
1. **Hard Skills:** Programming languages, frameworks, tools, technologies (e.g., React, Python, AWS, Docker)
2. **Domain Knowledge:** Industry-specific knowledge, business domains (e.g., Fintech, E-commerce, Healthcare, Scalability, Microservices)
3. **Seniority:** Years of experience, leadership signals, scope of responsibility (e.g., "5+ years", "lead", "architect", "drive")

**Task:**
Analyze the resume and job description to categorize each skill/keyword from the JD into one of three statuses:
- **matched**: The skill is clearly present in the resume with strong evidence
- **missing**: The skill is required in the JD but not found in the resume
- **partial**: The skill is mentioned or implied but not clearly demonstrated (e.g., related technology but not exact match)

**Output Format:**
Return a JSON object with this structure:
{
  "matched": [
    {
      "skill": "React",
      "category": "hard_skills",
      "status": "matched",
      "evidence": "Built React component library consumed by 8 applications",
      "recommendation": null
    }
  ],
  "missing": [
    {
      "skill": "GraphQL",
      "category": "hard_skills",
      "status": "missing",
      "evidence": null,
      "recommendation": "Consider highlighting any API design experience or adding GraphQL to your skills"
    }
  ],
  "partial": [
    {
      "skill": "Microservices",
      "category": "domain_knowledge",
      "status": "partial",
      "evidence": "Mentioned decoupling code but not explicitly microservices",
      "recommendation": "Explicitly mention microservices architecture if applicable"
    }
  ],
  "summary": {
    "totalSkills": 15,
    "matchedCount": 8,
    "missingCount": 4,
    "partialCount": 3,
    "matchPercentage": 53.3
  }
}

**Rules:**
1. Be thorough - extract ALL significant skills/keywords from the JD
2. Be accurate - only mark as "matched" if there's clear evidence
3. Be helpful - provide actionable recommendations for missing/partial skills
4. Include evidence quotes from the resume when available
5. Calculate matchPercentage as: ((matchedCount + partialCount * 0.5) / totalSkills) * 100
   - Matched skills count as full credit (1.0)
   - Partial skills count as half credit (0.5)
   - Missing skills count as no credit (0.0)

**Output:**
Return ONLY a valid JSON object. No explanations, no markdown code blocks, no preamble.`;

    const userPrompt = `${SYSTEM_PROMPT}

## Resume Profile (JSON)
\`\`\`json
${JSON.stringify(request.resume, null, 2)}
\`\`\`

## Job Description
\`\`\`
${request.jobDescription}
\`\`\`

Analyze the skill gaps and return the JSON report.`;

    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const rawContent = response.text || '';
    
    // Helper to find a balanced JSON object; if unbalanced, attempts to close braces
    function extractJsonObject(text: string): string | null {
      const start = text.indexOf("{");
      if (start === -1) return null;

      let depth = 0;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (ch === "{") depth++;
        if (ch === "}") depth--;
        if (depth === 0) {
          return text.substring(start, i + 1);
        }
      }

      // If we never balanced, try to close remaining braces
      if (depth > 0) {
        return text.substring(start) + "}".repeat(depth);
      }

      return null;
    }
    
    // Helper function to transform null to undefined for optional fields
    function transformNullToUndefined(obj: unknown): unknown {
      if (obj === null) {
        return undefined;
      }
      if (Array.isArray(obj)) {
        return obj.map(transformNullToUndefined);
      }
      if (typeof obj === 'object' && obj !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = transformNullToUndefined(value);
        }
        return result;
      }
      return obj;
    }
    
    // Try to parse JSON, handling potential code blocks
    let analysisResult: SkillGapAnalysisResponse;
    try {
      // First, try to clean markdown code blocks
      const cleaned = stripMarkdownCodeBlocks(rawContent);
      const parsed = JSON.parse(cleaned);
      
      // Transform null values to undefined for optional fields (safety measure)
      const transformed = transformNullToUndefined(parsed);
      
      // Validate against schema (now accepts null via .nullish(), but transformation is safe)
      analysisResult = SkillGapAnalysisResponseSchema.parse(transformed);
    } catch (error) {
      // If parsing fails, try to extract JSON from the response using balanced braces
      const jsonText = extractJsonObject(rawContent);

      if (jsonText) {
        try {
          const parsed = JSON.parse(jsonText);
          
          // Transform null values to undefined for optional fields (safety measure)
          const transformed = transformNullToUndefined(parsed);
          
          analysisResult = SkillGapAnalysisResponseSchema.parse(transformed);
        } catch (parseError) {
          // If still failing, provide more context in the error
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          
          // Log the raw response for debugging when validation fails
          console.error('=== Skill Gap Analysis Validation Error ===');
          console.error('Parse error:', errorMessage);
          console.error('Raw response length:', rawContent.length);
          console.error('Raw response (first 2000 chars):', rawContent.substring(0, 2000));
          console.error('Parsed JSON (first 2000 chars):', JSON.stringify(JSON.parse(jsonText), null, 2).substring(0, 2000));
          console.error('===========================================');
          
          // Find the line and column of the error if possible
          const errorMatch = errorMessage.match(/position (\d+)/);
          const errorPos = errorMatch ? parseInt(errorMatch[1], 10) : -1;
          
          let context = '';
          if (errorPos > 0 && errorPos < jsonText.length) {
            const start = Math.max(0, errorPos - 200);
            const end = Math.min(jsonText.length, errorPos + 200);
            context = `\n\nError at position ${errorPos}:\n${jsonText.substring(start, end)}\n${' '.repeat(errorPos - start)}^`;
          } else {
            // Show around line 44 if that's where the error is
            const lines = jsonText.split('\n');
            if (lines.length > 44) {
              const startLine = Math.max(0, 40);
              const endLine = Math.min(lines.length, 50);
              context = `\n\nAround line 44:\n${lines.slice(startLine, endLine).join('\n')}`;
            }
          }
          
          throw new Error(
            `Failed to parse AI response as valid JSON. ` +
            `Parse error: ${errorMessage}.` +
            context +
            `\n\nFull response length: ${rawContent.length} chars`
          );
        }
      } else {
        // Last-resort attempt: trim to last closing brace if present
        const lastBrace = rawContent.lastIndexOf("}");
        if (lastBrace !== -1) {
          const candidate = rawContent.substring(rawContent.indexOf("{"), lastBrace + 1);
          try {
            const parsed = JSON.parse(candidate);
            const transformed = transformNullToUndefined(parsed);
            analysisResult = SkillGapAnalysisResponseSchema.parse(transformed);
          } catch (parseError) {
            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
            throw new Error(
              `Failed to extract JSON object from AI response. ` +
              `Parse error: ${errorMessage}. ` +
              `Response length: ${rawContent.length}. ` +
              `First 500 chars: ${rawContent.substring(0, 500)}`
            );
          }
        } else {
          throw new Error(
            `Failed to extract JSON object from AI response. ` +
            `Response length: ${rawContent.length}. ` +
            `First 500 chars: ${rawContent.substring(0, 500)}`
          );
        }
      }
    }

    // Ensure all arrays exist and recalculate match percentage with correct formula
    const matched = analysisResult.matched || [];
    const missing = analysisResult.missing || [];
    const partial = analysisResult.partial || [];
    const matchedCount = matched.length;
    const missingCount = missing.length;
    const partialCount = partial.length;
    const totalSkills = matchedCount + missingCount + partialCount;
    
    // Calculate match percentage: matched = 1.0, partial = 0.5, missing = 0.0
    const matchPercentage = totalSkills > 0
      ? ((matchedCount + partialCount * 0.5) / totalSkills) * 100
      : 0;
    
    return {
      matched,
      missing,
      partial,
      summary: {
        totalSkills,
        matchedCount,
        missingCount,
        partialCount,
        matchPercentage: Math.round(matchPercentage * 100) / 100, // Round to 2 decimal places
      },
    };
  },
};


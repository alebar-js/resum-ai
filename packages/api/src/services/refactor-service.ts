import { GoogleGenAI } from '@google/genai';
import { RefactorDataRequest, RefactorDataResponse, ResumeProfile } from '@app/shared';
import { resumeService } from './resume-service.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

export const refactorService = {
  async refactorResumeData(request: RefactorDataRequest): Promise<RefactorDataResponse> {
    const masterResume = await resumeService.getMasterResumeData();

    if (!masterResume || !masterResume.data) {
      throw new Error('No master resume found. Please create one first.');
    }

    // Extract basics to preserve them (don't send to LLM)
    const originalBasics = masterResume.data.basics;
    
    // Create a resume without basics for LLM processing
    const resumeWithoutBasics = {
      ...masterResume.data,
      
    };

    const SYSTEM_PROMPT = `You are a Resume Refactoring Engine.

**Input:**
1. \`BaseResume\` (JSON object following ResumeProfile schema, but basics fields like name, email, phone, url, and location are excluded)
2. \`JobDescription\` (Text)

**Task:**
Return a \`TargetResume\` JSON object that aligns the base resume with the job description.

**Rules:**
1. \`basics.label\`: Update to match the JD title if relevant.
2. \`work[].highlights\`: Rewrite bullet points to use keywords from the JD. Reorder to prioritize JD-relevant accomplishments.
3. \`skills\`: Reorder keywords to prioritize JD requirements.
4. Do NOT remove jobs unless explicitly told.
5. Do NOT fabricate dates, titles, or skills.
6. Maintain the exact same structure and all required fields.

**Output:**
Return ONLY a valid JSON object matching the ResumeProfile schema. No explanations, no markdown code blocks, no preamble.`;

    const userPrompt = `${SYSTEM_PROMPT}

## Base Resume (JSON)
\`\`\`json
${JSON.stringify(resumeWithoutBasics, null, 2)}
\`\`\`

## Job Description
\`\`\`
${request.jobDescription}
\`\`\`

Return the refactored resume as a JSON object following the exact same ResumeProfile schema.`;

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
    
    // Try to parse JSON, handling potential code blocks
    let refactoredData: ResumeProfile;
    try {
      refactoredData = JSON.parse(rawContent) as ResumeProfile;
    } catch (error) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        refactoredData = JSON.parse(jsonMatch[0]) as ResumeProfile;
      } else {
        throw new Error('Failed to parse AI response as JSON. Response: ' + rawContent.substring(0, 200));
      }
    }

    // Merge back the original basics (preserve name, email, phone, url, location)
    // Only allow label to change
    const mergedRefactored: ResumeProfile = {
      ...refactoredData,
      basics: {
        ...originalBasics,
        label: refactoredData.basics.label, // Allow label to be updated
      },
    };

    return {
      original: masterResume.data,
      refactored: mergedRefactored,
    };
  },
};

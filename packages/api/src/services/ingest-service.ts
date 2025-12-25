import { GoogleGenAI } from '@google/genai';
import { LlamaParseReader } from 'llama-cloud-services';
import { ResumeProfile, ResumeProfileSchema } from '@app/shared';
import { stripMarkdownCodeBlocks } from './utils.js';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const GEMINI_MODEL = 'gemini-2.5-flash';

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

function getLlamaCloudApiKey(): string {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error('LLAMA_CLOUD_API_KEY environment variable is not set');
  }
  return apiKey;
}

const SYSTEM_PROMPT = `You are a Resume Parser Agent. Your task is to convert resume content (in Markdown format) into a structured JSON object.

**Output Schema (ResumeProfile):**
{
  "id": "string (UUID)",
  "basics": {
    "name": "string",
    "label": "string (job title/professional headline)",
    "email": "string",
    "phone": "string",
    "url": "string (optional, personal website/portfolio)",
    "location": {
      "city": "string",
      "region": "string"
    }
  },
  "work": [
    {
      "id": "string (UUID)",
      "company": "string",
      "position": "string",
      "startDate": "string (YYYY-MM format)",
      "endDate": "string (YYYY-MM format, or omit for current)",
      "highlights": ["string (bullet point accomplishments)"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "area": "string (field of study)",
      "studyType": "string (degree type, e.g., Bachelor's, Master's)",
      "startDate": "string (YYYY-MM format)",
      "endDate": "string (YYYY-MM format, optional)"
    }
  ],
  "skills": [
    {
      "name": "string (category, e.g., 'Programming Languages', 'Frameworks')",
      "keywords": ["string (individual skills)"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "highlights": ["string"],
      "url": "string (optional)"
    }
  ]
}

**Rules:**
1. Extract ALL information from the resume content accurately.
2. Generate UUIDs for the main "id" field and each work experience "id".
3. Parse dates to YYYY-MM format when possible. If only year is provided, use YYYY-01.
4. Group skills into logical categories (e.g., "Programming Languages", "Frameworks", "Tools", "Soft Skills").
5. Preserve the exact wording of bullet points in highlights.
6. If a field cannot be determined, use an empty string or empty array.
7. Return ONLY valid JSON. No explanations, no markdown code blocks, no preamble.`;

export interface IngestResult {
  markdown: string;
  profile: ResumeProfile;
}

export const ingestService = {
  /**
   * Parse a resume file (PDF or DOCX) using LlamaParse and convert to structured JSON
   */
  async parseFile(fileBuffer: Buffer, filename: string): Promise<IngestResult> {
    // Save buffer to temp file (LlamaParse needs a file path)
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-'));
    const tempFilePath = path.join(tempDir, filename);
    
    try {
      await fs.writeFile(tempFilePath, fileBuffer);
      
      // Step 1: Extract markdown using LlamaParse
      const apiKey = getLlamaCloudApiKey();
      const reader = new LlamaParseReader({
        apiKey,
        resultType: 'markdown',
      });
      
      const documents = await reader.loadData(tempFilePath);
      
      if (!documents || documents.length === 0) {
        throw new Error('LlamaParse failed to extract content from the file');
      }
      
      const markdown = documents[0].text;
      
      // Step 2: Convert markdown to structured JSON using Gemini
      const profile = await this.convertToProfile(markdown);
      
      return {
        markdown,
        profile,
      };
    } finally {
      // Cleanup temp files
      try {
        await fs.unlink(tempFilePath);
        await fs.rmdir(tempDir);
      } catch {
        // Ignore cleanup errors
      }
    }
  },

  /**
   * Parse raw text resume content and convert to structured JSON
   */
  async parseText(text: string): Promise<IngestResult> {
    // For raw text, we treat it as markdown and directly convert
    const profile = await this.convertToProfile(text);
    
    return {
      markdown: text,
      profile,
    };
  },

  /**
   * Convert markdown/text content to ResumeProfile using Gemini
   */
  async convertToProfile(content: string): Promise<ResumeProfile> {
    const userPrompt = `${SYSTEM_PROMPT}

## Resume Content
\`\`\`
${content}
\`\`\`

Parse the above resume and return a valid JSON object matching the ResumeProfile schema.`;

    const apiKey = getGeminiApiKey();
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
    
    // Parse and validate the JSON response
    let profile: ResumeProfile;
    try {
      const cleaned = stripMarkdownCodeBlocks(rawContent);
      const parsed = JSON.parse(cleaned);
      
      // Ensure IDs are present
      if (!parsed.id) {
        parsed.id = randomUUID();
      }
      
      if (parsed.work) {
        parsed.work = parsed.work.map((job: Record<string, unknown>) => ({
          ...job,
          id: job.id || randomUUID(),
        }));
      }
      
      // Validate against schema
      profile = ResumeProfileSchema.parse(parsed);
    } catch (error) {
      // Try to extract JSON from the response if parsing fails
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure IDs are present
        if (!parsed.id) {
          parsed.id = randomUUID();
        }
        
        if (parsed.work) {
          parsed.work = parsed.work.map((job: Record<string, unknown>) => ({
            ...job,
            id: job.id || randomUUID(),
          }));
        }
        
        profile = ResumeProfileSchema.parse(parsed);
      } else {
        throw new Error('Failed to parse AI response as valid ResumeProfile JSON. Response: ' + rawContent.substring(0, 200));
      }
    }

    return profile;
  },
};


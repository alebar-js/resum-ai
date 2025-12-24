import { RefactorRequest, RefactorResponse } from '@app/shared';
import { resumeService } from './resume-service';

const SYSTEM_PROMPT = `You are a Senior Career Refactor Agent. Your task is to modify a Markdown-formatted Base Resume to align with a provided Job Description.

## Transformation Rules
1. **Term Alignment:** Identify high-priority keywords in the JD and update the resume terminology to match exactly (e.g., "Software Engineer" -> "Fullstack Engineer" if the JD requires it).
2. **Bullet Prioritization:** Reorder bullet points to put the most relevant experience for the specific JD at the top of each section.
3. **Strict Integrity:** Never fabricate dates, titles, or skills. Only rephrase and emphasize existing data.
4. **Markdown Format:** Output only valid Markdown. Do not include conversational text or explanations.

Respond ONLY with the refactored resume in Markdown format. No explanations, no preamble.`;

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

export const refactorService = {
  async refactorResume(request: RefactorRequest): Promise<RefactorResponse> {
    const masterResume = await resumeService.getMasterResume();

    if (!masterResume || !masterResume.content) {
      throw new Error('No master resume found. Please create one first.');
    }

    const userPrompt = `${SYSTEM_PROMPT}

## Base Resume (Markdown)
\`\`\`markdown
${masterResume.content}
\`\`\`

## Job Description
\`\`\`
${request.jobDescription}
\`\`\`

Refactor the resume above to align with this job description. Output ONLY the refactored Markdown.`;

    const apiKey = getApiKey();
    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as GeminiResponse;

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    const refactoredContent = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return {
      original: masterResume.content,
      refactored: refactoredContent,
    };
  },
};

const CLEANUP_SYSTEM_PROMPT = `You are a Resume Formatting Agent. Your task is to convert raw, unstructured resume text into clean, well-formatted Markdown.

## Formatting Rules
1. **Name as H1:** The person's name should be the first line as a level 1 heading (# Name).
2. **Contact Information:** Place email, phone, and location on separate lines below the name (no heading).
3. **Section Headings as H2:** All major sections should be level 2 headings (## Section Name).
   - Common sections: Education, Experience, Work Experience, Skills, Projects, Certifications, etc.
4. **Bullet Points:** Use standard Markdown list format (- or *) for achievements and responsibilities.
5. **Dates:** Keep dates in a consistent format (e.g., "January 2021 - Present" or "2021 - 2024").
6. **Preserve Content:** Do not add, remove, or modify any factual information. Only reformat the structure.
7. **Clean Formatting:** Remove extra whitespace, normalize spacing, and ensure consistent formatting throughout.

## Output Requirements
- Output ONLY the formatted Markdown.
- Do not include explanations, comments, or conversational text.
- Ensure all headings use proper Markdown syntax (# for H1, ## for H2).
- Maintain all original information exactly as provided.

Convert the following raw resume text into properly formatted Markdown:`;

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

export const cleanupService = {
  async cleanupResume(rawText: string): Promise<string> {
    if (!rawText.trim()) {
      throw new Error('Resume text cannot be empty');
    }

    const userPrompt = `${CLEANUP_SYSTEM_PROMPT}

\`\`\`
${rawText}
\`\`\`

Format this resume into clean Markdown following the rules above. Output ONLY the formatted Markdown.`;

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

    const cleanedContent = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!cleanedContent.trim()) {
      throw new Error('Cleanup service returned empty content');
    }

    return cleanedContent;
  },
};


/**
 * Strips markdown code block delimiters from AI-generated content.
 * Removes leading ```markdown, ```md, or ``` and trailing ```
 */
function stripMarkdownCodeBlocks(text: string): string {
  if (!text) return text;

  let cleaned = text.trim();

  // Remove leading code block markers (```markdown, ```md, or just ```)
  cleaned = cleaned.replace(/^```(?:markdown|md)?\s*\n?/i, '');

  // Remove trailing code block markers (```)
  cleaned = cleaned.replace(/\n?```\s*$/i, '');

  return cleaned.trim();
}

export { stripMarkdownCodeBlocks };


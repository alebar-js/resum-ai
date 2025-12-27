import type { VercelRequest } from '@vercel/node';
import { ZodSchema } from 'zod';

export function readJsonBody(req: VercelRequest): unknown {
  if (req.body === undefined || req.body === null) return {};
  if (typeof req.body === 'string') {
    if (req.body.length === 0) return {};
    return JSON.parse(req.body);
  }
  return req.body;
}

export function validateBody<T>(schema: ZodSchema<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid request: ${issues}`);
  }
  return parsed.data;
}


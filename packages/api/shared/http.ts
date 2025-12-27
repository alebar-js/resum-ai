import type { VercelRequest, VercelResponse } from '@vercel/node';

export type ApiErrorBody = { error: string; code: number; details?: unknown };

export function json<T>(res: VercelResponse, status: number, body: T) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(body as any);
}

export function sendError(res: VercelResponse, err: unknown, status = 400) {
  const message = err instanceof Error ? err.message : 'Unexpected error';
  const body: ApiErrorBody = { error: message, code: status };
  if (process.env.NODE_ENV !== 'production') {
    body.details = err instanceof Error ? err.stack : err;
  }
  return json(res, status, body);
}

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = process.env.CORS_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (origin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}


import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../dist/app.js';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;

async function getApp() {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const fastify = await getApp();
  
  // Fastify's inject method to handle the request
  const response = await fastify.inject({
    method: req.method as any,
    url: req.url || '/',
    headers: req.headers as any,
    payload: req.body,
  });

  // Set response headers
  for (const [key, value] of Object.entries(response.headers)) {
    if (value) {
      res.setHeader(key, value as string);
    }
  }

  res.status(response.statusCode).send(response.payload);
}


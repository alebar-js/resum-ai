import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IngestTextRequestSchema } from '@app/shared';
import { ingestService } from '../../src/services/ingest-service.js';
import { applyCors, json, sendError } from '../../shared/http.js';
import { readJsonBody, validateBody } from '../../shared/validate.js';
import { withAuth } from '../../shared/auth.js';

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  }

  try {
    const body = validateBody(IngestTextRequestSchema, readJsonBody(req));
    const result = await ingestService.parseText(body.text);
    return json(res, 200, result);
  } catch (err) {
    return sendError(res, err);
  }
});


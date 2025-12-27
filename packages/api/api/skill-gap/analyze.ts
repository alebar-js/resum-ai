import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SkillGapAnalysisRequestSchema } from '@app/shared';
import { skillGapService } from '../../src/services/skill-gap-service.js';
import { applyCors, json, sendError } from '../../shared/http.js';
import { readJsonBody, validateBody } from '../../shared/validate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  }

  try {
    const body = validateBody(SkillGapAnalysisRequestSchema, readJsonBody(req));
    const result = await skillGapService.analyzeSkillGaps(body);
    return json(res, 200, result);
  } catch (err) {
    return sendError(res, err);
  }
}


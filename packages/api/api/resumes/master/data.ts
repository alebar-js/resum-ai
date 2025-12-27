import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResumeDataSchema, UpdateResumeDataSchema } from '@app/shared';
import { resumeService } from '../../../src/services/resume-service.js';
import { applyCors, json, sendError } from '../../../shared/http.js';
import { readJsonBody, validateBody } from '../../../shared/validate.js';
import { withAuth } from '../../../shared/auth.js';

export default withAuth(async (req: VercelRequest & { user: { id: string } }, res: VercelResponse) => {
  if (applyCors(req, res)) return;

  try {
    if (req.method === 'GET') {
      const data = await resumeService.getMasterResumeData(req.user.id);
      return json(res, 200, data);
    }

    if (req.method === 'PUT') {
      const body = validateBody(UpdateResumeDataSchema, readJsonBody(req));
      const updated = await resumeService.upsertMasterResumeData(body, req.user.id);
      return json(res, 200, updated);
    }

    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  } catch (err) {
    return sendError(res, err);
  }
});


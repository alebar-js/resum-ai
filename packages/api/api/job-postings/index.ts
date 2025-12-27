import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CreateJobPostingDataSchema } from '@app/shared';
import { jobPostingService } from '../../../src/services/job-posting-service.js';
import { applyCors, json, sendError } from '../../../shared/http.js';
import { readJsonBody, validateBody } from '../../../shared/validate.js';
import { withAuth } from '../../../shared/auth.js';

export default withAuth(async (req: VercelRequest & { user: { id: string } }, res: VercelResponse) => {
  if (applyCors(req, res)) return;

  try {
    if (req.method === 'GET') {
      const data = await jobPostingService.getJobPostingsData(req.user.id);
      return json(res, 200, data);
    }

    if (req.method === 'POST') {
      const body = validateBody(CreateJobPostingDataSchema, readJsonBody(req));
      const created = await jobPostingService.createJobPostingData(body, req.user.id);
      return json(res, 201, created);
    }

    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  } catch (err) {
    return sendError(res, err);
  }
});


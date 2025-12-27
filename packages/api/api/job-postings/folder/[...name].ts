import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jobPostingService } from '../../../../src/services/job-posting-service.js';
import { applyCors, json, sendError } from '../../../../shared/http.js';
import { withAuth } from '../../../../shared/auth.js';

export default withAuth(async (req: VercelRequest & { user: { id: string } }, res: VercelResponse) => {
  if (applyCors(req, res)) return;

  try {
    if (req.method !== 'DELETE') {
      return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
    }

    const nameParam = req.query.name;
    if (!nameParam) {
      return res.status(400).json({ error: 'Folder name is required', code: 400 });
    }

    const name = Array.isArray(nameParam) ? nameParam.join('/') : nameParam;
    const folderPath = name.startsWith('/') ? name : `/${name}`;

    const deletedCount = await jobPostingService.deleteJobPostingsByFolderPath(folderPath, req.user.id);
    return json(res, 200, { deletedCount });
  } catch (err) {
    return sendError(res, err);
  }
});


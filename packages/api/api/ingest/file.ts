import type { VercelRequest, VercelResponse } from '@vercel/node';
import Busboy from 'busboy';
import { ingestService } from '../../src/services/ingest-service.js';
import { applyCors, json, sendError } from '../../shared/http.js';
import { withAuth } from '../../shared/auth.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function parseMultipart(req: VercelRequest): Promise<{ buffer: Buffer; filename: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'];
    if (!contentType) {
      return reject(new Error('Missing Content-Type header'));
    }

    const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE } });
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mime = '';
    let fileReceived = false;

    busboy.on('file', (_fieldname, file, info) => {
      fileReceived = true;
      filename = info.filename;
      mime = info.mimeType;
      const chunks: Buffer[] = [];
      file.on('data', (data) => chunks.push(data));
      file.on('limit', () => reject(new Error('File too large')));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      if (!fileReceived || !fileBuffer) return reject(new Error('No file uploaded'));
      resolve({ buffer: fileBuffer, filename, mime });
    });

    busboy.on('error', (err) => reject(err));

    // @ts-expect-error node req is readable
    req.pipe(busboy);
  });
}

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  }

  try {
    const { buffer, filename, mime } = await parseMultipart(req);
    const lower = filename.toLowerCase();
    const ext = lower.substring(lower.lastIndexOf('.'));

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`, code: 400 });
    }

    if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
      return res.status(400).json({ error: 'Invalid MIME type. Allowed: PDF, DOCX', code: 400 });
    }

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty', code: 400 });
    }

    const result = await ingestService.parseFile(buffer, filename);
    return json(res, 200, result);
  } catch (err) {
    return sendError(res, err);
  }
});


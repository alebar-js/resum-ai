import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import multipart from '@fastify/multipart';
import { 
  IngestTextRequestSchema, 
  IngestResponseSchema, 
  ErrorResponseSchema 
} from '@app/shared';
import { ingestService } from '../services/ingest-service.js';

// Allowed file types for resume upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function ingestRoutes(fastify: FastifyInstance) {
  // Register multipart support for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });

  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Protect all ingest routes
  app.addHook('onRequest', fastify.authenticate);

  // ============================================================================
  // POST /ingest/file - Parse a resume file (PDF or DOCX)
  // ============================================================================
  app.post('/ingest/file', {
    schema: {
      response: {
        200: IngestResponseSchema,
        400: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Validate file type
      const filename = data.filename.toLowerCase();
      const extension = filename.substring(filename.lastIndexOf('.'));
      
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return reply.status(400).send({ 
          error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` 
        });
      }

      if (data.mimetype && !ALLOWED_MIME_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({ 
          error: `Invalid MIME type. Allowed types: PDF, DOCX` 
        });
      }

      // Read file buffer
      const buffer = await data.toBuffer();
      
      if (buffer.length === 0) {
        return reply.status(400).send({ error: 'Uploaded file is empty' });
      }

      // Parse the file
      const result = await ingestService.parseFile(buffer, data.filename);
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse resume file';
      request.log.error(error, 'Ingest file error');
      return reply.status(400).send({ error: message });
    }
  });

  // ============================================================================
  // POST /ingest/text - Parse raw text resume content
  // ============================================================================
  app.post('/ingest/text', {
    schema: {
      body: IngestTextRequestSchema,
      response: {
        200: IngestResponseSchema,
        400: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const result = await ingestService.parseText(request.body.text);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse resume text';
      request.log.error(error, 'Ingest text error');
      return reply.status(400).send({ error: message });
    }
  });
}


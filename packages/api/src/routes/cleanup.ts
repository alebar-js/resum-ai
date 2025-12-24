import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { CleanupRequestSchema, CleanupResponseSchema, ErrorResponseSchema } from '@app/shared';
import { cleanupService } from '../services/cleanup-service.js';

export async function cleanupRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Cleanup raw resume text into formatted Markdown
  app.post('/cleanup', {
    schema: {
      body: CleanupRequestSchema,
      response: {
        200: CleanupResponseSchema,
        400: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const cleaned = await cleanupService.cleanupResume(request.body.text);
      return { cleaned };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cleanup failed';
      return reply.status(400).send({ error: message });
    }
  });
}


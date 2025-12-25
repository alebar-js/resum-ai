import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { RefactorDataRequestSchema, RefactorDataResponseSchema, ErrorResponseSchema } from '@app/shared';
import { refactorService } from '../services/refactor-service';

export async function refactorRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Refactor the master resume based on a job description (JSON)
  app.post('/refactor/data', {
    schema: {
      body: RefactorDataRequestSchema,
      response: {
        200: RefactorDataResponseSchema,
        400: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const result = await refactorService.refactorResumeData(request.body);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refactor failed';
      return reply.status(400).send({ error: message });
    }
  });
}

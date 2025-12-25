import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SkillGapAnalysisRequestSchema, SkillGapAnalysisResponseSchema, ErrorResponseSchema } from '@app/shared';
import { skillGapService } from '../services/skill-gap-service.js';

export async function skillGapRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Analyze skill gaps between master resume and job description
  app.post('/skill-gap/analyze', {
    schema: {
      body: SkillGapAnalysisRequestSchema,
      response: {
        200: SkillGapAnalysisResponseSchema,
        400: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const result = await skillGapService.analyzeSkillGaps(request.body);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Skill gap analysis failed';
      return reply.status(400).send({ error: message });
    }
  });
}


import { z } from 'zod';

// Basic error response (for 400, 404, etc.)
export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Validation error detail (matches Fastify's validation error structure)
const ValidationErrorDetailSchema = z.object({
  instancePath: z.string(),
  schemaPath: z.string(),
  keyword: z.string(),
  params: z.record(z.unknown()),
  message: z.string().optional(),
});

// Validation error response (400 from Zod/Fastify validation)
export const ValidationErrorResponseSchema = z.object({
  error: z.literal('Validation Error'),
  details: z.array(ValidationErrorDetailSchema),
});

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;

// Internal server error response (500)
export const InternalErrorResponseSchema = z.object({
  error: z.literal('Internal Server Error'),
  message: z.string(),
});

export type InternalErrorResponse = z.infer<typeof InternalErrorResponseSchema>;

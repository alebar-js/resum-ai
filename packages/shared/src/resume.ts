import { z } from 'zod';

// Job Fork status enum as const map (following backend.md - avoid enums)
export const FORK_STATUS = {
  DRAFT: 'DRAFT',
  MERGED: 'MERGED',
  EXPORTED: 'EXPORTED',
} as const;

export const ForkStatusSchema = z.enum(['DRAFT', 'MERGED', 'EXPORTED']);
export type ForkStatus = z.infer<typeof ForkStatusSchema>;

// Master Resume Schema
export const ResumeSchema = z.object({
  id: z.string().uuid(),
  content: z.string(), // Markdown content
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Resume = z.infer<typeof ResumeSchema>;

export const UpdateResumeSchema = z.object({
  content: z.string().min(1, 'Resume content cannot be empty'),
});

export type UpdateResume = z.infer<typeof UpdateResumeSchema>;

// Job Fork Schema
export const JobForkSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1), // e.g., "Meta - Sr. Engineer"
  jobDescription: z.string(), // The original JD
  content: z.string(), // The tailored resume Markdown
  status: ForkStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type JobFork = z.infer<typeof JobForkSchema>;

export const CreateJobForkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  jobDescription: z.string().min(1, 'Job description is required'),
  content: z.string().min(1, 'Content is required'),
});

export type CreateJobFork = z.infer<typeof CreateJobForkSchema>;

export const UpdateJobForkSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  status: ForkStatusSchema.optional(),
});

export type UpdateJobFork = z.infer<typeof UpdateJobForkSchema>;

// Refactor Request/Response Schemas
export const RefactorRequestSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required'),
});

export type RefactorRequest = z.infer<typeof RefactorRequestSchema>;

export const RefactorResponseSchema = z.object({
  original: z.string(),
  refactored: z.string(),
});

export type RefactorResponse = z.infer<typeof RefactorResponseSchema>;

// Cleanup Request/Response Schemas
export const CleanupRequestSchema = z.object({
  text: z.string().min(1, 'Resume text is required'),
});

export type CleanupRequest = z.infer<typeof CleanupRequestSchema>;

export const CleanupResponseSchema = z.object({
  cleaned: z.string(),
});

export type CleanupResponse = z.infer<typeof CleanupResponseSchema>;


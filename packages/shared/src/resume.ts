import { z } from 'zod';

// Job Posting status enum as const map (following backend.md - avoid enums)
export const JOB_POSTING_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  EXPORTED: 'EXPORTED',
  APPLIED: 'APPLIED',
  OFFER: 'OFFER',
  REJECTED: 'REJECTED',
} as const;

export const JobPostingStatusSchema = z.enum(['IN_PROGRESS', 'READY', 'EXPORTED', 'APPLIED', 'OFFER', 'REJECTED']);
export type JobPostingStatus = z.infer<typeof JobPostingStatusSchema>;

// ============================================================================
// NEW MODULAR RESUME SCHEMA (Structured JSON)
// ============================================================================

export const LocationSchema = z.object({
  city: z.string(),
  region: z.string(),
}).optional();

export type Location = z.infer<typeof LocationSchema>;

export const BasicsSchema = z.object({
  name: z.string().default(""),
  label: z.string().default(""), // e.g. "Senior Fullstack Engineer"
  email: z.string().email().or(z.literal("")).default(""), // Allow empty string for drafts
  phone: z.string().default(""),
  url: z.string().url().optional().or(z.literal("")), // Allow empty string
  location: LocationSchema,
});

export type Basics = z.infer<typeof BasicsSchema>;

export const JobSchema = z.object({
  id: z.string().uuid(), // Unique ID for diffing
  company: z.string().default(""),
  position: z.string().default(""),
  startDate: z.string().default(""), // ISO or "YYYY-MM"
  endDate: z.string().optional(), // "Present" if null
  highlights: z.array(z.string()).default([]), // The bullet points (Crucial for AI Refactoring)
});

export type Job = z.infer<typeof JobSchema>;

export const EducationSchema = z.object({
  institution: z.string().default(""),
  area: z.string().default(""),
  studyType: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().optional(),
});

export type Education = z.infer<typeof EducationSchema>;

export const ProjectSchema = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  highlights: z.array(z.string()).default([]),
  url: z.string().url().optional().or(z.literal("")), // Allow empty string
}).optional();

export type Project = z.infer<typeof ProjectSchema>;

export const SkillSchema = z.object({
  name: z.string().default(""), // e.g. "Frontend"
  keywords: z.array(z.string()).default([]), // e.g. ["React", "TypeScript", "Tailwind"]
});

export type Skill = z.infer<typeof SkillSchema>;

export const ResumeProfileSchema = z.object({
  id: z.string().uuid(),
  basics: BasicsSchema,
  work: z.array(JobSchema),
  education: z.array(EducationSchema),
  skills: z.array(SkillSchema),
  projects: z.array(ProjectSchema).optional(),
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

// ============================================================================
// RESUME DATA SCHEMAS
// ============================================================================

// Master Resume Schema
export const ResumeDataSchema = z.object({
  id: z.string().uuid(),
  data: ResumeProfileSchema, // The structured JSON object
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;

export const UpdateResumeDataSchema = z.object({
  data: ResumeProfileSchema,
});

export type UpdateResumeData = z.infer<typeof UpdateResumeDataSchema>;

// ============================================================================
// JOB POSTING SCHEMAS
// ============================================================================

export const JobPostingDataSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  jobDescription: z.string(),
  postingUrl: z.string().url().nullable().optional(), // The job posting URL (nullable/optional)
  data: ResumeProfileSchema.nullable(), // The tailored resume JSON (nullable if not yet created)
  status: JobPostingStatusSchema,
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export type JobPostingData = z.infer<typeof JobPostingDataSchema>;

export const CreateJobPostingDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  jobDescription: z.string().min(1, 'Job description is required'),
  postingUrl: z.string().url().optional().or(z.literal('')), // Optional URL field
  data: ResumeProfileSchema,
});

export type CreateJobPostingData = z.infer<typeof CreateJobPostingDataSchema>;

export const UpdateJobPostingDataSchema = z.object({
  title: z.string().min(1).optional(),
  jobDescription: z.string().optional(),
  postingUrl: z.string().url().optional().or(z.literal('')), // Optional URL field (empty string to clear)
  data: ResumeProfileSchema.optional(),
  status: JobPostingStatusSchema.optional(),
});

export type UpdateJobPostingData = z.infer<typeof UpdateJobPostingDataSchema>;

// ============================================================================
// REFACTOR SCHEMAS
// ============================================================================

// Refactor Request/Response Schemas (Legacy - Markdown)
export const RefactorRequestSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required'),
});

export type RefactorRequest = z.infer<typeof RefactorRequestSchema>;

export const RefactorResponseSchema = z.object({
  original: z.string(),
  refactored: z.string(),
});

export type RefactorResponse = z.infer<typeof RefactorResponseSchema>;

// Refactor Request/Response Schemas (New - JSON)
export const RefactorDataRequestSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required'),
});

export type RefactorDataRequest = z.infer<typeof RefactorDataRequestSchema>;

export const RefactorDataResponseSchema = z.object({
  original: ResumeProfileSchema,
  refactored: ResumeProfileSchema,
});

export type RefactorDataResponse = z.infer<typeof RefactorDataResponseSchema>;

// ============================================================================
// SKILL GAP ANALYSIS SCHEMAS
// ============================================================================

export const SkillGapCategorySchema = z.enum(['hard_skills', 'domain_knowledge', 'seniority']);
export type SkillGapCategory = z.infer<typeof SkillGapCategorySchema>;

export const SkillGapStatusSchema = z.enum(['matched', 'missing', 'partial']);
export type SkillGapStatus = z.infer<typeof SkillGapStatusSchema>;

export const SkillGapItemSchema = z.object({
  skill: z.string(), // The skill/keyword from JD
  category: SkillGapCategorySchema,
  status: SkillGapStatusSchema,
  evidence: z.string().nullish(), // Evidence from resume (if partial/matched) - can be string, null, or undefined
  recommendation: z.string().nullish(), // Recommendation for improvement - can be string, null, or undefined
});

export type SkillGapItem = z.infer<typeof SkillGapItemSchema>;

export const SkillGapAnalysisRequestSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required'),
  resume: ResumeProfileSchema,
});

export type SkillGapAnalysisRequest = z.infer<typeof SkillGapAnalysisRequestSchema>;

export const SkillGapAnalysisResponseSchema = z.object({
  matched: z.array(SkillGapItemSchema),
  missing: z.array(SkillGapItemSchema),
  partial: z.array(SkillGapItemSchema),
  summary: z.object({
    totalSkills: z.number(),
    matchedCount: z.number(),
    missingCount: z.number(),
    partialCount: z.number(),
    matchPercentage: z.number(), // 0-100
  }),
});

export type SkillGapAnalysisResponse = z.infer<typeof SkillGapAnalysisResponseSchema>;

// ============================================================================
// INGEST (RESUME PARSING) SCHEMAS
// ============================================================================

// Ingest text request (for raw text input)
export const IngestTextRequestSchema = z.object({
  text: z.string().min(1, 'Resume text is required'),
});

export type IngestTextRequest = z.infer<typeof IngestTextRequestSchema>;

// Ingest response (returned after parsing)
export const IngestResponseSchema = z.object({
  markdown: z.string(),
  profile: ResumeProfileSchema,
});

export type IngestResponse = z.infer<typeof IngestResponseSchema>;


import { pgTable, uuid, varchar, timestamp, text, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { ResumeProfile } from '@app/shared';

// Users table (existing)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;

// Resumes table (supports both master and forks)
export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id), // Nullable until auth is implemented
  isMaster: boolean('is_master').notNull().default(false),
  data: jsonb('data').$type<ResumeProfile>(), // The ResumeProfile JSON object (nullable for backward compatibility)
  targetJobId: uuid('target_job_id').references(() => jobPostings.id), // Null for Master, Link to job_postings for forks
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbResume = typeof resumes.$inferSelect;
export type NewDbResume = typeof resumes.$inferInsert;

export const jobPostingStatusEnum = pgEnum('job_posting_status', ['IN_PROGRESS', 'READY', 'EXPORTED', 'APPLIED', 'OFFER', 'REJECTED']);

// Job Postings table (stores job applications/descriptions)
export const jobPostings = pgTable('job_postings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id), // Nullable until auth is implemented
  companyName: varchar('company_name', { length: 255 }), // e.g., "Meta" (nullable for backward compatibility)
  title: varchar('title', { length: 255 }).notNull(), // e.g., "Meta - Sr. Engineer"
  jobDescription: text('job_description').notNull(), // The raw input text
  postingUrl: text('posting_url'),
  status: jobPostingStatusEnum('status').notNull().default('IN_PROGRESS'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbJobPosting = typeof jobPostings.$inferSelect;
export type NewDbJobPosting = typeof jobPostings.$inferInsert;

// Relations
export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  targetJob: one(jobPostings, {
    fields: [resumes.targetJobId],
    references: [jobPostings.id],
  }),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  user: one(users, {
    fields: [jobPostings.userId],
    references: [users.id],
  }),
  resumes: many(resumes),
}));

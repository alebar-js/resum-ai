import { pgTable, uuid, varchar, timestamp, text, pgEnum } from 'drizzle-orm/pg-core';

// Users table (existing)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;

// Master Resume table (single record pattern)
export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbResume = typeof resumes.$inferSelect;
export type NewDbResume = typeof resumes.$inferInsert;

export const forkStatusEnum = pgEnum('fork_status', ['DRAFT', 'MERGED', 'EXPORTED']);

// Job Forks table
export const jobForks = pgTable('job_forks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  jobDescription: text('job_description').notNull(),
  content: text('content').notNull(),
  status: forkStatusEnum('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbJobFork = typeof jobForks.$inferSelect;
export type NewDbJobFork = typeof jobForks.$inferInsert;

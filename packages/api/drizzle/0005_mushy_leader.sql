ALTER TYPE "public"."job_posting_status" ADD VALUE IF NOT EXISTS 'APPLIED';--> statement-breakpoint
ALTER TYPE "public"."job_posting_status" ADD VALUE IF NOT EXISTS 'OFFER';--> statement-breakpoint
ALTER TYPE "public"."job_posting_status" ADD VALUE IF NOT EXISTS 'REJECTED';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN IF NOT EXISTS "posting_url" text;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN IF NOT EXISTS "path" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "picture" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "linkedin_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "job_postings" DROP COLUMN IF EXISTS "content";--> statement-breakpoint
ALTER TABLE "resumes" DROP COLUMN IF EXISTS "content";--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_google_id_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_github_id_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_github_id_unique" UNIQUE("github_id");
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_linkedin_id_unique'
  ) THEN
ALTER TABLE "users" ADD CONSTRAINT "users_linkedin_id_unique" UNIQUE("linkedin_id");
  END IF;
END $$;--> statement-breakpoint
-- Step 1: Rename the table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_forks') THEN
    ALTER TABLE "job_forks" RENAME TO "job_postings";
  END IF;
END $$;
--> statement-breakpoint

-- Step 2: Remove the default value that depends on the enum
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'status') THEN
    ALTER TABLE "job_postings" ALTER COLUMN "status" DROP DEFAULT;
  END IF;
END $$;
--> statement-breakpoint

-- Step 3: Convert enum values to text temporarily, mapping old values to new ones
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'status') THEN
    ALTER TABLE "job_postings" ALTER COLUMN "status" SET DATA TYPE text;
    UPDATE "job_postings" SET "status" = CASE 
      WHEN "status" = 'DRAFT' THEN 'IN_PROGRESS'
      WHEN "status" = 'MERGED' THEN 'READY'
      WHEN "status" = 'EXPORTED' THEN 'EXPORTED'
      ELSE 'IN_PROGRESS'
    END;
  END IF;
END $$;
--> statement-breakpoint

-- Step 4: Drop the old enum (now safe since no dependencies)
DROP TYPE IF EXISTS "public"."fork_status" CASCADE;
--> statement-breakpoint

-- Step 5: Create the new enum with new values
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_posting_status') THEN
    CREATE TYPE "public"."job_posting_status" AS ENUM('IN_PROGRESS', 'READY', 'EXPORTED');
  END IF;
END $$;
--> statement-breakpoint

-- Step 6: Convert the column back to the new enum type
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'status' AND data_type = 'text') THEN
    ALTER TABLE "job_postings" ALTER COLUMN "status" SET DATA TYPE "public"."job_posting_status" USING "status"::"public"."job_posting_status";
  END IF;
END $$;
--> statement-breakpoint

-- Step 7: Set the new default value
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'status') THEN
    ALTER TABLE "job_postings" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';
  END IF;
END $$;
--> statement-breakpoint

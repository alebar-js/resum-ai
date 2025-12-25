ALTER TABLE "job_postings" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "company_name" varchar(255);--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "is_master" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "data" jsonb;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "target_job_id" uuid;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_target_job_id_job_postings_id_fk" FOREIGN KEY ("target_job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;
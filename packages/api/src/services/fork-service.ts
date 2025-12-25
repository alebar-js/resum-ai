import { JobPosting, CreateJobPosting, UpdateJobPosting } from '@app/shared';
import { db } from '../db/index.js';
import { jobPostings } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const jobPostingService = {
  async getJobPostings(): Promise<JobPosting[]> {
    const results = await db
      .select()
      .from(jobPostings)
      .orderBy(desc(jobPostings.updatedAt));

    return results.map((row) => ({
      id: row.id,
      title: row.title,
      jobDescription: row.jobDescription,
      content: row.content,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },

  async getJobPostingById(id: string): Promise<JobPosting | null> {
    const [jobPosting] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, id))
      .limit(1);

    if (!jobPosting) return null;

    return {
      id: jobPosting.id,
      title: jobPosting.title,
      jobDescription: jobPosting.jobDescription,
      content: jobPosting.content,
      status: jobPosting.status,
      createdAt: jobPosting.createdAt,
      updatedAt: jobPosting.updatedAt,
    };
  },

  async createJobPosting(data: CreateJobPosting): Promise<JobPosting> {
    const [created] = await db
      .insert(jobPostings)
      .values({
        title: data.title,
        jobDescription: data.jobDescription,
        content: data.content,
        status: 'IN_PROGRESS',
      })
      .returning();

    return {
      id: created.id,
      title: created.title,
      jobDescription: created.jobDescription,
      content: created.content,
      status: created.status,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  async updateJobPosting(id: string, data: UpdateJobPosting): Promise<JobPosting | null> {
    const existing = await this.getJobPostingById(id);
    if (!existing) return null;

    const [updated] = await db
      .update(jobPostings)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.status && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(jobPostings.id, id))
      .returning();

    return {
      id: updated.id,
      title: updated.title,
      jobDescription: updated.jobDescription,
      content: updated.content,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },

  async deleteJobPosting(id: string): Promise<boolean> {
    const result = await db
      .delete(jobPostings)
      .where(eq(jobPostings.id, id))
      .returning({ id: jobPostings.id });

    return result.length > 0;
  },
};


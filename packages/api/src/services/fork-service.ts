import { JobFork, CreateJobFork, UpdateJobFork } from '@app/shared';
import { db } from '../db/index.js';
import { jobForks } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const forkService = {
  async getForks(): Promise<JobFork[]> {
    const results = await db
      .select()
      .from(jobForks)
      .orderBy(desc(jobForks.updatedAt));

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

  async getForkById(id: string): Promise<JobFork | null> {
    const [fork] = await db
      .select()
      .from(jobForks)
      .where(eq(jobForks.id, id))
      .limit(1);

    if (!fork) return null;

    return {
      id: fork.id,
      title: fork.title,
      jobDescription: fork.jobDescription,
      content: fork.content,
      status: fork.status,
      createdAt: fork.createdAt,
      updatedAt: fork.updatedAt,
    };
  },

  async createFork(data: CreateJobFork): Promise<JobFork> {
    const [created] = await db
      .insert(jobForks)
      .values({
        title: data.title,
        jobDescription: data.jobDescription,
        content: data.content,
        status: 'DRAFT',
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

  async updateFork(id: string, data: UpdateJobFork): Promise<JobFork | null> {
    const existing = await this.getForkById(id);
    if (!existing) return null;

    const [updated] = await db
      .update(jobForks)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.status && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(jobForks.id, id))
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

  async deleteFork(id: string): Promise<boolean> {
    const result = await db
      .delete(jobForks)
      .where(eq(jobForks.id, id))
      .returning({ id: jobForks.id });

    return result.length > 0;
  },
};


import { ResumeData, UpdateResumeData, ResumeProfile } from '@app/shared';
import { db } from '../db/index.js';
import { resumes } from '../db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

export const resumeService = {
  async getMasterResumeData(userId: string | null = null): Promise<ResumeData | null> {
    const [resume] = await db
      .select()
      .from(resumes)
      .where(
        and(
          userId ? eq(resumes.userId, userId) : isNull(resumes.userId),
          eq(resumes.isMaster, true),
          isNull(resumes.targetJobId)
        )
      )
      .limit(1);

    if (!resume || !resume.data) return null;

    return {
      id: resume.id,
      data: resume.data,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  },

  async upsertMasterResumeData(data: UpdateResumeData, userId: string | null = null): Promise<ResumeData> {
    // Check if master resume row exists (regardless of data field)
    const [existingRow] = await db
      .select()
      .from(resumes)
      .where(
        and(
          userId ? eq(resumes.userId, userId) : isNull(resumes.userId),
          eq(resumes.isMaster, true),
          isNull(resumes.targetJobId)
        )
      )
      .limit(1);

    if (existingRow) {
      // Update existing master resume
      const [updated] = await db
        .update(resumes)
        .set({
          data: data.data,
          updatedAt: new Date(),
        })
        .where(eq(resumes.id, existingRow.id))
        .returning();

      return {
        id: updated.id,
        data: updated.data as ResumeProfile,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    // Create new master resume
    const [created] = await db
      .insert(resumes)
      .values({
        userId,
        isMaster: true,
        data: data.data,
      })
      .returning();

    return {
      id: created.id,
      data: created.data as ResumeProfile,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  async getResumeByJobPostingId(jobPostingId: string): Promise<ResumeData | null> {
    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.targetJobId, jobPostingId))
      .limit(1);

    if (!resume || !resume.data) return null;

    return {
      id: resume.id,
      data: resume.data,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  },

  async createResumeForJobPosting(
    jobPostingId: string,
    data: ResumeProfile
  ): Promise<ResumeData> {
    const [created] = await db
      .insert(resumes)
      .values({
        isMaster: false,
        targetJobId: jobPostingId,
        data: data,
      })
      .returning();

    return {
      id: created.id,
      data: created.data as ResumeProfile,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  async updateResumeForJobPosting(
    jobPostingId: string,
    data: ResumeProfile
  ): Promise<ResumeData | null> {
    const existing = await this.getResumeByJobPostingId(jobPostingId);

    if (!existing) {
      return this.createResumeForJobPosting(jobPostingId, data);
    }

    const [updated] = await db
      .update(resumes)
      .set({
        data: data,
        updatedAt: new Date(),
      })
      .where(eq(resumes.id, existing.id))
      .returning();

    return {
      id: updated.id,
      data: updated.data as ResumeProfile,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },
};


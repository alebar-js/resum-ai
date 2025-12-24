import { Resume, UpdateResume } from '@app/shared';
import { db } from '../db/index.js';
import { resumes } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const MASTER_RESUME_ID = '00000000-0000-0000-0000-000000000001';

export const resumeService = {
  async getMasterResume(): Promise<Resume | null> {
    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, MASTER_RESUME_ID))
      .limit(1);

    if (!resume) return null;

    return {
      id: resume.id,
      content: resume.content,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  },

  async upsertMasterResume(data: UpdateResume): Promise<Resume> {
    const existing = await this.getMasterResume();

    if (existing) {
      const [updated] = await db
        .update(resumes)
        .set({
          content: data.content,
          updatedAt: new Date(),
        })
        .where(eq(resumes.id, MASTER_RESUME_ID))
        .returning();

      return {
        id: updated.id,
        content: updated.content,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    const [created] = await db
      .insert(resumes)
      .values({
        id: MASTER_RESUME_ID,
        content: data.content,
      })
      .returning();

    return {
      id: created.id,
      content: created.content,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },
};


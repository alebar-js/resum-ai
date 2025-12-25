import { JobPostingData, CreateJobPostingData, UpdateJobPostingData } from '@app/shared';
import { db } from '../db/index.js';
import { jobPostings } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const jobPostingService = {
  async deleteJobPosting(id: string): Promise<boolean> {
    const result = await db
      .delete(jobPostings)
      .where(eq(jobPostings.id, id))
      .returning({ id: jobPostings.id });

    return result.length > 0;
  },

  async getJobPostingsData(): Promise<JobPostingData[]> {
    const results = await db
      .select()
      .from(jobPostings)
      .orderBy(desc(jobPostings.updatedAt));

    // Fetch resume data for each job posting
    const resultsWithData = await Promise.all(
      results.map(async (row) => {
        const { resumeService } = await import('./resume-service.js');
        const resumeData = await resumeService.getResumeByJobPostingId(row.id);
        return {
          id: row.id,
          title: row.title,
          jobDescription: row.jobDescription,
          postingUrl: row.postingUrl,
          data: resumeData?.data || null,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      })
    );

    return resultsWithData;
  },

  async getJobPostingDataById(id: string): Promise<JobPostingData | null> {
    const [jobPosting] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, id))
      .limit(1);

    if (!jobPosting) return null;

    // Get the linked resume data if it exists
    const { resumeService } = await import('./resume-service.js');
    const resumeData = await resumeService.getResumeByJobPostingId(id);

    return {
      id: jobPosting.id,
      title: jobPosting.title,
      jobDescription: jobPosting.jobDescription,
      postingUrl: jobPosting.postingUrl || null,
      data: resumeData?.data || null,
      status: jobPosting.status,
      createdAt: jobPosting.createdAt,
      updatedAt: jobPosting.updatedAt,
    };
  },

  async createJobPostingData(data: CreateJobPostingData): Promise<JobPostingData> {
    // Extract company name from title if not provided
    const companyName = data.title.split(' - ')[0] || data.title;

    const [created] = await db
      .insert(jobPostings)
      .values({
        title: data.title,
        companyName: companyName,
        jobDescription: data.jobDescription,
        postingUrl: data.postingUrl && data.postingUrl.trim() !== '' ? data.postingUrl : null,
        status: 'IN_PROGRESS',
      })
      .returning();

    // Create linked resume
    const { resumeService } = await import('./resume-service.js');
    await resumeService.createResumeForJobPosting(created.id, data.data);

    // Fetch the created job posting with resume data
    const result = await this.getJobPostingDataById(created.id);
    if (!result) {
      throw new Error('Failed to create job posting');
    }

    return result;
  },

  async updateJobPostingData(id: string, data: UpdateJobPostingData): Promise<JobPostingData | null> {
    const existing = await this.getJobPostingDataById(id);
    if (!existing) return null;

    // Update job posting fields
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (data.title) {
      updateFields.title = data.title;
      // Update company name if title changed
      updateFields.companyName = data.title.split(' - ')[0] || data.title;
    }

    if (data.jobDescription !== undefined) {
      updateFields.jobDescription = data.jobDescription;
    }

    if (data.postingUrl !== undefined) {
      updateFields.postingUrl = data.postingUrl && data.postingUrl.trim() !== '' ? data.postingUrl : null;
    }

    if (data.status) {
      updateFields.status = data.status;
    }

    await db
      .update(jobPostings)
      .set(updateFields)
      .where(eq(jobPostings.id, id));

    // Update linked resume if data is provided
    if (data.data) {
      const { resumeService } = await import('./resume-service.js');
      await resumeService.updateResumeForJobPosting(id, data.data);
    }

    return this.getJobPostingDataById(id);
  },
};


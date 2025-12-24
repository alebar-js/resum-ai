import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resumeService } from '../resume-service';
import { db } from '../../db/index';
import { resumes } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { Resume, UpdateResume } from '@app/shared';

// Mock the database
vi.mock('../../db/index', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value })),
}));

const MASTER_RESUME_ID = '00000000-0000-0000-0000-000000000001';

describe('resumeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMasterResume', () => {
    it('should return null when no resume exists', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await resumeService.getMasterResume();

      expect(result).toBeNull();
      expect(db.select).toHaveBeenCalledWith();
      expect(mockSelect.from).toHaveBeenCalledWith(resumes);
      expect(mockSelect.limit).toHaveBeenCalledWith(1);
    });

    it('should return resume when it exists', async () => {
      const mockResume = {
        id: MASTER_RESUME_ID,
        content: '# My Resume',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockResume]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await resumeService.getMasterResume();

      expect(result).toEqual(mockResume);
    });
  });

  describe('upsertMasterResume', () => {
    it('should create a new resume when none exists', async () => {
      const updateData: UpdateResume = { content: '# New Resume' };
      const mockCreated = {
        id: MASTER_RESUME_ID,
        content: updateData.content,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // Mock getMasterResume to return null
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      // Mock insert
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreated]),
      };
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await resumeService.upsertMasterResume(updateData);

      expect(result).toEqual(mockCreated);
      expect(db.insert).toHaveBeenCalledWith(resumes);
      expect(mockInsert.values).toHaveBeenCalledWith({
        id: MASTER_RESUME_ID,
        content: updateData.content,
      });
    });

    it('should update existing resume', async () => {
      const updateData: UpdateResume = { content: '# Updated Resume' };
      const existingResume = {
        id: MASTER_RESUME_ID,
        content: '# Old Resume',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      const mockUpdated = {
        ...existingResume,
        content: updateData.content,
        updatedAt: new Date('2024-01-02'),
      };

      // Mock getMasterResume to return existing
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingResume]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      // Mock update
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdated]),
      };
      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await resumeService.upsertMasterResume(updateData);

      expect(result).toEqual(mockUpdated);
      expect(db.update).toHaveBeenCalledWith(resumes);
      expect(mockUpdate.set).toHaveBeenCalledWith({
        content: updateData.content,
        updatedAt: expect.any(Date),
      });
    });
  });
});


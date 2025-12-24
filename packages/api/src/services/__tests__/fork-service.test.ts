import { describe, it, expect, beforeEach, vi } from 'vitest';
import { forkService } from '../fork-service';
import { db } from '../../db/index';
import { jobForks } from '../../db/schema';
import type { CreateJobFork, UpdateJobFork, JobFork } from '@app/shared';

// Mock the database
vi.mock('../../db/index', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value })),
  desc: vi.fn((column) => ({ column, direction: 'desc' })),
}));

describe('forkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getForks', () => {
    it('should return an empty array when no forks exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await forkService.getForks();

      expect(result).toEqual([]);
      expect(mockSelect.orderBy).toHaveBeenCalled();
    });

    it('should return all forks ordered by updatedAt desc', async () => {
      const mockForks = [
        {
          id: '1',
          title: 'Meta - Sr. Engineer',
          jobDescription: 'JD 1',
          content: 'Content 1',
          status: 'DRAFT' as const,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          id: '2',
          title: 'Google - Engineer',
          jobDescription: 'JD 2',
          content: 'Content 2',
          status: 'MERGED' as const,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockForks),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await forkService.getForks();

      expect(result).toEqual(mockForks);
      expect(mockSelect.from).toHaveBeenCalledWith(jobForks);
    });
  });

  describe('getForkById', () => {
    it('should return null when fork does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await forkService.getForkById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return fork when it exists', async () => {
      const mockFork = {
        id: '1',
        title: 'Meta - Sr. Engineer',
        jobDescription: 'JD',
        content: 'Content',
        status: 'DRAFT' as const,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockFork]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await forkService.getForkById('1');

      expect(result).toEqual(mockFork);
    });
  });

  describe('createFork', () => {
    it('should create a new fork with DRAFT status', async () => {
      const createData: CreateJobFork = {
        title: 'Meta - Sr. Engineer',
        jobDescription: 'Job description here',
        content: 'Resume content',
      };

      const mockCreated = {
        id: 'new-id',
        ...createData,
        status: 'DRAFT' as const,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreated]),
      };
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await forkService.createFork(createData);

      expect(result).toEqual(mockCreated);
      expect(mockInsert.values).toHaveBeenCalledWith({
        title: createData.title,
        jobDescription: createData.jobDescription,
        content: createData.content,
        status: 'DRAFT',
      });
    });
  });

  describe('updateFork', () => {
    it('should return null when fork does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await forkService.updateFork('non-existent', { title: 'New Title' });

      expect(result).toBeNull();
    });

    it('should update fork when it exists', async () => {
      const existingFork = {
        id: '1',
        title: 'Old Title',
        jobDescription: 'JD',
        content: 'Content',
        status: 'DRAFT' as const,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updateData: UpdateJobFork = { title: 'New Title', status: 'MERGED' };
      const mockUpdated = {
        ...existingFork,
        ...updateData,
        updatedAt: new Date('2024-01-02'),
      };

      // Mock getForkById
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingFork]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      // Mock update
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdated]),
      };
      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await forkService.updateFork('1', updateData);

      expect(result).toEqual(mockUpdated);
      expect(mockUpdate.set).toHaveBeenCalledWith({
        title: updateData.title,
        status: updateData.status,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('deleteFork', () => {
    it('should return false when fork does not exist', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await forkService.deleteFork('non-existent');

      expect(result).toBe(false);
    });

    it('should return true when fork is deleted', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: '1' }]),
      };
      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await forkService.deleteFork('1');

      expect(result).toBe(true);
      expect(db.delete).toHaveBeenCalledWith(jobForks);
    });
  });
});


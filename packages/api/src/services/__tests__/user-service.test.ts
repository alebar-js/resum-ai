import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userService } from '../user-service';
import { db } from '../../db/index';
import { users } from '../../db/schema';
import type { CreateUser, User } from '@app/shared';

// Mock the database
vi.mock('../../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createData: CreateUser = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      const mockCreated = {
        id: 'user-id',
        ...createData,
        createdAt: new Date('2024-01-01'),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreated]),
      };
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await userService.createUser(createData);

      expect(result).toEqual(mockCreated);
      expect(db.insert).toHaveBeenCalledWith(users);
      expect(mockInsert.values).toHaveBeenCalledWith({
        email: createData.email,
        name: createData.name,
      });
    });
  });

  describe('listUsers', () => {
    it('should return an empty array when no users exist', async () => {
      const mockSelect = {
        from: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await userService.listUsers();

      expect(result).toEqual([]);
    });

    it('should return all users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User 1',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: 'User 2',
          createdAt: new Date('2024-01-02'),
        },
      ];

      const mockSelect = {
        from: vi.fn().mockResolvedValue(mockUsers),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await userService.listUsers();

      expect(result).toEqual(mockUsers);
      expect(db.select).toHaveBeenCalledWith();
      expect(mockSelect.from).toHaveBeenCalledWith(users);
    });
  });
});


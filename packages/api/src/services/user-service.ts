import { CreateUser, User } from '@app/shared';
import { randomUUID } from 'node:crypto';

// In a real app, this would use Drizzle ORM to interact with Postgres.
// For now, we'll use an in-memory mock.
const users: User[] = [];

export const userService = {
  async createUser(data: CreateUser): Promise<User> {
    const newUser: User = {
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
    };
    users.push(newUser);
    return newUser;
  },

  async listUsers(): Promise<User[]> {
    return users;
  }
};


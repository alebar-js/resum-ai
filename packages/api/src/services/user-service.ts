import { CreateUser, User } from '@app/shared';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export const userService = {
  async createUser(data: CreateUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
      } as any)
      .returning();

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
    };
  },

  async listUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.createdAt,
    }));
  },
};

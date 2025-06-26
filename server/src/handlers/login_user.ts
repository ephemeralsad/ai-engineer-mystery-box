
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginInput): Promise<User | null> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // Simple password hash comparison using Bun's built-in password hashing
    const passwordMatches = await Bun.password.verify(input.password, user.passwordHash);

    if (!passwordMatches) {
      return null; // Invalid password
    }

    // Return user data (excluding password hash)
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash, // Include in type but would typically exclude in real app
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

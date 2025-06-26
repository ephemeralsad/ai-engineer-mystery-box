
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password (simple implementation - in production use bcrypt)
    const passwordHash = await Bun.password.hash(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        passwordHash: passwordHash,
        firstName: input.firstName,
        lastName: input.lastName
      })
      .returning()
      .execute();

    // Return the created user
    const user = result[0];
    return {
      ...user,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

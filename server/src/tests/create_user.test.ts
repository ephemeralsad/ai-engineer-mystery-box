
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'testpassword123',
  firstName: 'John',
  lastName: 'Doe'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.firstName).toEqual('John');
    expect(result.lastName).toEqual('Doe');
    expect(result.id).toBeDefined();
    expect(result.passwordHash).toBeDefined();
    expect(result.passwordHash).not.toEqual(testInput.password); // Should be hashed
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].firstName).toEqual('John');
    expect(users[0].lastName).toEqual('Doe');
    expect(users[0].passwordHash).toBeDefined();
    expect(users[0].createdAt).toBeInstanceOf(Date);
    expect(users[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await createUser(testInput);

    // Password should be hashed, not stored in plain text
    expect(result.passwordHash).not.toEqual(testInput.password);
    expect(result.passwordHash.length).toBeGreaterThan(0);

    // Verify password hash using Bun's password verification
    const isValid = await Bun.password.verify(testInput.password, result.passwordHash);
    expect(isValid).toBe(true);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create second user with same email
    const duplicateInput: CreateUserInput = {
      ...testInput,
      firstName: 'Jane',
      lastName: 'Smith'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint|UNIQUE constraint failed/i);
  });

  it('should create users with different emails successfully', async () => {
    // Create first user
    const firstUser = await createUser(testInput);

    // Create second user with different email
    const secondInput: CreateUserInput = {
      email: 'test2@example.com',
      password: 'anotherpassword456',
      firstName: 'Jane',
      lastName: 'Smith'
    };

    const secondUser = await createUser(secondInput);

    expect(firstUser.id).not.toEqual(secondUser.id);
    expect(firstUser.email).toEqual('test@example.com');
    expect(secondUser.email).toEqual('test2@example.com');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });
});

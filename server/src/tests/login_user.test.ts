
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

const testUserData = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'password123'
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with correct credentials', async () => {
    // Create test user with hashed password
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        passwordHash: hashedPassword,
        firstName: testUserData.firstName,
        lastName: testUserData.lastName
      })
      .execute();

    const result = await loginUser(testLoginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.firstName).toEqual('John');
    expect(result!.lastName).toEqual('Doe');
    expect(result!.id).toBeDefined();
    expect(result!.createdAt).toBeInstanceOf(Date);
    expect(result!.updatedAt).toBeInstanceOf(Date);
    expect(result!.passwordHash).toBeDefined();
  });

  it('should return null for non-existent user', async () => {
    const nonExistentLoginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    const result = await loginUser(nonExistentLoginInput);

    expect(result).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Create test user with hashed password
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        passwordHash: hashedPassword,
        firstName: testUserData.firstName,
        lastName: testUserData.lastName
      })
      .execute();

    const wrongPasswordInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(wrongPasswordInput);

    expect(result).toBeNull();
  });

  it('should handle case-sensitive email matching', async () => {
    // Create test user with lowercase email
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: testUserData.firstName,
        lastName: testUserData.lastName
      })
      .execute();

    // Try login with uppercase email
    const uppercaseEmailInput: LoginInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'password123'
    };

    const result = await loginUser(uppercaseEmailInput);

    // Should return null since email case doesn't match
    expect(result).toBeNull();
  });

  it('should authenticate with exact email match', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        passwordHash: hashedPassword,
        firstName: testUserData.firstName,
        lastName: testUserData.lastName
      })
      .execute();

    // Login with exact same email
    const result = await loginUser(testLoginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
  });
});

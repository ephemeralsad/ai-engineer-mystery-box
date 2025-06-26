
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ordersTable } from '../db/schema';
import { type GetUserOrdersInput } from '../schema';
import { getUserOrders } from '../handlers/get_user_orders';

// Test user data
const testUser = {
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  firstName: 'John',
  lastName: 'Doe'
};

// Test order data
const testOrder1 = {
  status: 'Pending' as const,
  totalAmount: '99.99',
  shippingAddress: '123 Test St, Test City, TS 12345'
};

const testOrder2 = {
  status: 'Processing' as const,
  totalAmount: '149.50',
  shippingAddress: '456 Another St, Test City, TS 12345'
};

describe('getUserOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return orders for a specific user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create orders for the user
    await db.insert(ordersTable)
      .values([
        { ...testOrder1, userId: user.id },
        { ...testOrder2, userId: user.id }
      ])
      .execute();

    const input: GetUserOrdersInput = {
      userId: user.id
    };

    const result = await getUserOrders(input);

    expect(result).toHaveLength(2);
    
    // Verify order data and numeric conversion
    const order1 = result.find(o => o.status === 'Pending');
    const order2 = result.find(o => o.status === 'Processing');

    expect(order1).toBeDefined();
    expect(order1!.totalAmount).toEqual(99.99);
    expect(typeof order1!.totalAmount).toBe('number');
    expect(order1!.shippingAddress).toEqual(testOrder1.shippingAddress);
    expect(order1!.userId).toEqual(user.id);

    expect(order2).toBeDefined();
    expect(order2!.totalAmount).toEqual(149.50);
    expect(typeof order2!.totalAmount).toBe('number');
    expect(order2!.shippingAddress).toEqual(testOrder2.shippingAddress);
    expect(order2!.userId).toEqual(user.id);
  });

  it('should return empty array for user with no orders', async () => {
    // Create test user but no orders
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const input: GetUserOrdersInput = {
      userId: user.id
    };

    const result = await getUserOrders(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should not return orders for other users', async () => {
    // Create two test users
    const [user1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'user2@example.com'
      })
      .returning()
      .execute();

    // Create order for user1
    await db.insert(ordersTable)
      .values({ ...testOrder1, userId: user1.id })
      .execute();

    // Create order for user2
    await db.insert(ordersTable)
      .values({ ...testOrder2, userId: user2.id })
      .execute();

    // Query orders for user1
    const input: GetUserOrdersInput = {
      userId: user1.id
    };

    const result = await getUserOrders(input);

    // Should only return user1's order
    expect(result).toHaveLength(1);
    expect(result[0].userId).toEqual(user1.id);
    expect(result[0].status).toEqual('Pending');
    expect(result[0].totalAmount).toEqual(99.99);
  });

  it('should handle orders with null userId', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create order with null userId (guest order)
    await db.insert(ordersTable)
      .values({ ...testOrder1, userId: null })
      .execute();

    // Create order for the user
    await db.insert(ordersTable)
      .values({ ...testOrder2, userId: user.id })
      .execute();

    const input: GetUserOrdersInput = {
      userId: user.id
    };

    const result = await getUserOrders(input);

    // Should only return the user's order, not the guest order
    expect(result).toHaveLength(1);
    expect(result[0].userId).toEqual(user.id);
    expect(result[0].status).toEqual('Processing');
  });
});

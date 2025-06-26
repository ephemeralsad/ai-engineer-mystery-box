
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, usersTable } from '../db/schema';
import { type UpdateOrderStatusInput, type CreateUserInput } from '../schema';
import { updateOrderStatus } from '../handlers/update_order_status';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (): Promise<string> => {
  const userInput: CreateUserInput = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  };

  const result = await db.insert(usersTable)
    .values({
      email: userInput.email,
      passwordHash: 'hashedpassword',
      firstName: userInput.firstName,
      lastName: userInput.lastName
    })
    .returning()
    .execute();

  return result[0].id;
};

// Helper to create a test order
const createTestOrder = async (userId: string): Promise<string> => {
  const result = await db.insert(ordersTable)
    .values({
      userId,
      status: 'Pending',
      totalAmount: '99.99',
      shippingAddress: '123 Test St, Test City, TC 12345'
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateOrderStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update order status', async () => {
    const userId = await createTestUser();
    const orderId = await createTestOrder(userId);

    const input: UpdateOrderStatusInput = {
      id: orderId,
      status: 'Processing'
    };

    const result = await updateOrderStatus(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(orderId);
    expect(result!.status).toEqual('Processing');
    expect(result!.totalAmount).toEqual(99.99);
    expect(typeof result!.totalAmount).toBe('number');
    expect(result!.updatedAt).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    const userId = await createTestUser();
    const orderId = await createTestOrder(userId);

    const input: UpdateOrderStatusInput = {
      id: orderId,
      status: 'Shipped'
    };

    await updateOrderStatus(input);

    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toEqual('Shipped');
    expect(orders[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should return null for non-existent order', async () => {
    const input: UpdateOrderStatusInput = {
      id: '00000000-0000-0000-0000-000000000000',
      status: 'Processing'
    };

    const result = await updateOrderStatus(input);

    expect(result).toBeNull();
  });

  it('should update status to all valid enum values', async () => {
    const userId = await createTestUser();
    const orderId = await createTestOrder(userId);

    const statuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

    for (const status of statuses) {
      const input: UpdateOrderStatusInput = {
        id: orderId,
        status
      };

      const result = await updateOrderStatus(input);

      expect(result).not.toBeNull();
      expect(result!.status).toEqual(status);
    }
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surpriseBoxesTable, ordersTable, orderItemsTable, usersTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let testSurpriseBoxId: string;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test surprise box
    const boxResult = await db.insert(surpriseBoxesTable)
      .values({
        name: 'Test Box',
        tagline: 'Amazing test box',
        description: 'A box for testing',
        price: '29.99',
        imageUrl: 'https://example.com/image.jpg',
        category: 'Hardware',
        contentsDescription: 'Test contents',
        stock: 10,
        isActive: true
      })
      .returning()
      .execute();
    testSurpriseBoxId = boxResult[0].id;
  });

  it('should create an order with user', async () => {
    const input: CreateOrderInput = {
      userId: testUserId,
      shippingAddress: '123 Test St, Test City, TC 12345',
      items: [
        {
          surpriseBoxId: testSurpriseBoxId,
          quantity: 2
        }
      ]
    };

    const result = await createOrder(input);

    expect(result.userId).toEqual(testUserId);
    expect(result.status).toEqual('Pending');
    expect(result.totalAmount).toEqual(59.98); // 29.99 * 2
    expect(result.shippingAddress).toEqual(input.shippingAddress);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should create an order without user (guest)', async () => {
    const input: CreateOrderInput = {
      shippingAddress: '456 Guest Ave, Guest City, GC 67890',
      items: [
        {
          surpriseBoxId: testSurpriseBoxId,
          quantity: 1
        }
      ]
    };

    const result = await createOrder(input);

    expect(result.userId).toBeNull();
    expect(result.status).toEqual('Pending');
    expect(result.totalAmount).toEqual(29.99);
    expect(result.shippingAddress).toEqual(input.shippingAddress);
  });

  it('should create order items', async () => {
    const input: CreateOrderInput = {
      userId: testUserId,
      shippingAddress: '123 Test St, Test City, TC 12345',
      items: [
        {
          surpriseBoxId: testSurpriseBoxId,
          quantity: 3
        }
      ]
    };

    const result = await createOrder(input);

    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, result.id))
      .execute();

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].surpriseBoxId).toEqual(testSurpriseBoxId);
    expect(orderItems[0].quantity).toEqual(3);
    expect(parseFloat(orderItems[0].priceAtPurchase)).toEqual(29.99);
  });

  it('should update surprise box stock', async () => {
    const input: CreateOrderInput = {
      userId: testUserId,
      shippingAddress: '123 Test St, Test City, TC 12345',
      items: [
        {
          surpriseBoxId: testSurpriseBoxId,
          quantity: 3
        }
      ]
    };

    await createOrder(input);

    const updatedBox = await db.select()
      .from(surpriseBoxesTable)
      .where(eq(surpriseBoxesTable.id, testSurpriseBoxId))
      .execute();

    expect(updatedBox[0].stock).toEqual(7); // 10 - 3
  });

  it('should save order to database', async () => {
    const input: CreateOrderInput = {
      userId: testUserId,
      shippingAddress: '123 Test St, Test City, TC 12345',
      items: [
        {
          surpriseBoxId: testSurpriseBoxId,
          quantity: 1
        }
      ]
    };

    const result = await createOrder(input);

    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].userId).toEqual(testUserId);
    expect(parseFloat(orders[0].totalAmount)).toEqual(29.99);
    expect(orders[0].status).toEqual('Pending');
  });

  it('should handle multiple items correctly', async () => {
    // Create second surprise box
    const boxResult2 = await db.insert(surpriseBoxesTable)
      .values({
        name: 'Test Box 2',
        tagline: 'Another test box',
        description: 'Second box for testing',
        price: '19.99',
        imageUrl: 'https://example.com/image2.jpg',
        category: 'Software',
        contentsDescription: 'More test contents',
        stock: 5,
        isActive: true
      })
      .returning()
      .execute();
    const testSurpriseBoxId2 = boxResult2[0].id;

    const input: CreateOrderInput = {
      userId: testUserId,
      shippingAddress: '123 Test St, Test City, TC 12345',
      items: [
        {
          surpriseBoxId: testSurpriseBoxId,
          quantity: 2
        },
        {
          surpriseBoxId: testSurpriseBoxId2,
          quantity: 1
        }
      ]
    };

    const result = await createOrder(input);

    expect(result.totalAmount).toEqual(79.97); // (29.99 * 2) + 19.99

    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, result.id))
      .execute();

    expect(orderItems).toHaveLength(2);
  });

  it('should throw error for non-existent surprise box', async () => {
    const input: CreateOrderInput = {
      userId: testUserId,
      shippingAddress: '123 Test St, Test City, TC 12345',
      items: [
        {
          surpriseBoxId: crypto.randomUUID(),
          quantity: 1
        }
      ]
    };

    expect(createOrder(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error for insufficient stock', async () => {
    const input: CreateOrderInput = {
      userId: testUserId,
      shippingAddress: '123 Test St, Test City, TC 12345',
      items: [
        {
          surpriseBoxId: testSurpriseBoxId,
          quantity: 15 // More than the 10 in stock
        }
      ]
    };

    expect(createOrder(input)).rejects.toThrow(/insufficient stock/i);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, usersTable } from '../db/schema';
import { getOrders } from '../handlers/get_orders';

describe('getOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no orders exist', async () => {
    const result = await getOrders();
    expect(result).toEqual([]);
  });

  it('should return all orders', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test orders
    const order1 = await db.insert(ordersTable)
      .values({
        userId: userId,
        status: 'Pending',
        totalAmount: '99.99',
        shippingAddress: '123 Test St, City, State 12345'
      })
      .returning()
      .execute();

    const order2 = await db.insert(ordersTable)
      .values({
        userId: null, // Guest order
        status: 'Processing',
        totalAmount: '149.50',
        shippingAddress: '456 Another St, City, State 67890'
      })
      .returning()
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(2);
    
    // Check first order
    const firstOrder = result.find(o => o.id === order1[0].id);
    expect(firstOrder).toBeDefined();
    expect(firstOrder!.userId).toEqual(userId);
    expect(firstOrder!.status).toEqual('Pending');
    expect(firstOrder!.totalAmount).toEqual(99.99);
    expect(typeof firstOrder!.totalAmount).toBe('number');
    expect(firstOrder!.shippingAddress).toEqual('123 Test St, City, State 12345');
    expect(firstOrder!.createdAt).toBeInstanceOf(Date);
    expect(firstOrder!.updatedAt).toBeInstanceOf(Date);

    // Check second order
    const secondOrder = result.find(o => o.id === order2[0].id);
    expect(secondOrder).toBeDefined();
    expect(secondOrder!.userId).toBeNull();
    expect(secondOrder!.status).toEqual('Processing');
    expect(secondOrder!.totalAmount).toEqual(149.50);
    expect(typeof secondOrder!.totalAmount).toBe('number');
    expect(secondOrder!.shippingAddress).toEqual('456 Another St, City, State 67890');
  });

  it('should handle orders with different statuses', async () => {
    // Create orders with different statuses
    await db.insert(ordersTable)
      .values([
        {
          userId: null,
          status: 'Pending',
          totalAmount: '50.00',
          shippingAddress: 'Address 1'
        },
        {
          userId: null,
          status: 'Shipped',
          totalAmount: '75.25',
          shippingAddress: 'Address 2'
        },
        {
          userId: null,
          status: 'Delivered',
          totalAmount: '100.99',
          shippingAddress: 'Address 3'
        },
        {
          userId: null,
          status: 'Cancelled',
          totalAmount: '25.50',
          shippingAddress: 'Address 4'
        }
      ])
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(4);
    
    const statuses = result.map(order => order.status);
    expect(statuses).toContain('Pending');
    expect(statuses).toContain('Shipped');
    expect(statuses).toContain('Delivered');
    expect(statuses).toContain('Cancelled');

    // Verify all amounts are properly converted to numbers
    result.forEach(order => {
      expect(typeof order.totalAmount).toBe('number');
      expect(order.totalAmount).toBeGreaterThan(0);
    });
  });
});

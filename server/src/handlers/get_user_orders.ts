
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type GetUserOrdersInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserOrders = async (input: GetUserOrdersInput): Promise<Order[]> => {
  try {
    const results = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, input.userId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(order => ({
      ...order,
      totalAmount: parseFloat(order.totalAmount) // Convert string back to number
    }));
  } catch (error) {
    console.error('Get user orders failed:', error);
    throw error;
  }
};

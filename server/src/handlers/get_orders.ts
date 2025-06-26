
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type Order } from '../schema';

export const getOrders = async (): Promise<Order[]> => {
  try {
    const results = await db.select()
      .from(ordersTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(order => ({
      ...order,
      totalAmount: parseFloat(order.totalAmount)
    }));
  } catch (error) {
    console.error('Get orders failed:', error);
    throw error;
  }
};

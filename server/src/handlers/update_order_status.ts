
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type UpdateOrderStatusInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const updateOrderStatus = async (input: UpdateOrderStatusInput): Promise<Order | null> => {
  try {
    // Update order status
    const result = await db.update(ordersTable)
      .set({
        status: input.status,
        updatedAt: new Date()
      })
      .where(eq(ordersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const order = result[0];
    return {
      ...order,
      totalAmount: parseFloat(order.totalAmount)
    };
  } catch (error) {
    console.error('Order status update failed:', error);
    throw error;
  }
};

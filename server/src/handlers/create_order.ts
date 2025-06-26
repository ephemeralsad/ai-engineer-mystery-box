
import { db } from '../db';
import { ordersTable, orderItemsTable, surpriseBoxesTable } from '../db/schema';
import { type CreateOrderInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    // First, validate all items exist and have sufficient stock
    const itemsWithPrices: Array<{ surpriseBoxId: string; quantity: number; price: number }> = [];
    let totalAmount = 0;

    for (const item of input.items) {
      const surpriseBox = await db.select()
        .from(surpriseBoxesTable)
        .where(eq(surpriseBoxesTable.id, item.surpriseBoxId))
        .execute();

      if (surpriseBox.length === 0) {
        throw new Error(`Surprise box with ID ${item.surpriseBoxId} not found`);
      }

      const box = surpriseBox[0];
      if (box.stock < item.quantity) {
        throw new Error(`Insufficient stock for surprise box ${box.name}`);
      }

      const price = parseFloat(box.price);
      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;

      itemsWithPrices.push({
        surpriseBoxId: item.surpriseBoxId,
        quantity: item.quantity,
        price: price
      });
    }

    // Create the order
    const orderResult = await db.insert(ordersTable)
      .values({
        userId: input.userId || null,
        status: 'Pending',
        totalAmount: totalAmount.toString(),
        shippingAddress: input.shippingAddress
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    const orderItemsData = itemsWithPrices.map(item => ({
      orderId: order.id,
      surpriseBoxId: item.surpriseBoxId,
      quantity: item.quantity,
      priceAtPurchase: item.price.toString()
    }));

    await db.insert(orderItemsTable)
      .values(orderItemsData)
      .execute();

    // Update stock quantities
    for (const item of input.items) {
      // Get current stock
      const currentBox = await db.select()
        .from(surpriseBoxesTable)
        .where(eq(surpriseBoxesTable.id, item.surpriseBoxId))
        .execute();
      
      // Update with new stock value
      await db.update(surpriseBoxesTable)
        .set({
          stock: currentBox[0].stock - item.quantity,
          updatedAt: new Date()
        })
        .where(eq(surpriseBoxesTable.id, item.surpriseBoxId))
        .execute();
    }

    // Return the created order with proper type conversion
    return {
      ...order,
      totalAmount: parseFloat(order.totalAmount)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};

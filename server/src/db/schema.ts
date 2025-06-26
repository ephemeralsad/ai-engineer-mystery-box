
import { pgTable, uuid, text, numeric, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const categoryEnum = pgEnum('category', ['Hardware', 'Software', 'Books', 'Gadgets', 'Apparel', 'Productivity']);
export const orderStatusEnum = pgEnum('order_status', ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);

// Tables
export const surpriseBoxesTable = pgTable('surprise_boxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url').notNull(),
  category: categoryEnum('category').notNull(),
  contentsDescription: text('contents_description').notNull(),
  stock: integer('stock').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const ordersTable = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  status: orderStatusEnum('status').notNull().default('Pending'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text('shipping_address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const orderItemsTable = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  surpriseBoxId: uuid('surprise_box_id').notNull(),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const surpriseBoxesRelations = relations(surpriseBoxesTable, ({ many }) => ({
  orderItems: many(orderItemsTable)
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
  orders: many(ordersTable)
}));

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [ordersTable.userId],
    references: [usersTable.id]
  }),
  items: many(orderItemsTable)
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.orderId],
    references: [ordersTable.id]
  }),
  surpriseBox: one(surpriseBoxesTable, {
    fields: [orderItemsTable.surpriseBoxId],
    references: [surpriseBoxesTable.id]
  })
}));

// Export all tables for relation queries
export const tables = {
  surpriseBoxes: surpriseBoxesTable,
  users: usersTable,
  orders: ordersTable,
  orderItems: orderItemsTable
};

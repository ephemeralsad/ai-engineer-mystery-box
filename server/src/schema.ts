
import { z } from 'zod';

// SurpriseBox schemas
export const surpriseBoxSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  price: z.number().positive(),
  imageUrl: z.string().url(),
  category: z.enum(['Hardware', 'Software', 'Books', 'Gadgets', 'Apparel', 'Productivity']),
  contentsDescription: z.string(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export type SurpriseBox = z.infer<typeof surpriseBoxSchema>;

export const createSurpriseBoxInputSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  imageUrl: z.string().url(),
  category: z.enum(['Hardware', 'Software', 'Books', 'Gadgets', 'Apparel', 'Productivity']),
  contentsDescription: z.string().min(1),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean().default(true)
});

export type CreateSurpriseBoxInput = z.infer<typeof createSurpriseBoxInputSchema>;

export const updateSurpriseBoxInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  tagline: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  category: z.enum(['Hardware', 'Software', 'Books', 'Gadgets', 'Apparel', 'Productivity']).optional(),
  contentsDescription: z.string().min(1).optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional()
});

export type UpdateSurpriseBoxInput = z.infer<typeof updateSurpriseBoxInputSchema>;

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Order schemas
export const orderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  status: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']),
  totalAmount: z.number().positive(),
  shippingAddress: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

export const createOrderInputSchema = z.object({
  userId: z.string().uuid().optional(),
  shippingAddress: z.string().min(1),
  items: z.array(z.object({
    surpriseBoxId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1)
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;

// OrderItem schemas
export const orderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  surpriseBoxId: z.string().uuid(),
  quantity: z.number().int().positive(),
  priceAtPurchase: z.number().positive(),
  createdAt: z.coerce.date()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Filter and search schemas
export const getSurpriseBoxesInputSchema = z.object({
  category: z.enum(['Hardware', 'Software', 'Books', 'Gadgets', 'Apparel', 'Productivity']).optional(),
  search: z.string().optional(),
  activeOnly: z.boolean().default(true)
});

export type GetSurpriseBoxesInput = z.infer<typeof getSurpriseBoxesInputSchema>;

export const getSurpriseBoxByIdInputSchema = z.object({
  id: z.string().uuid()
});

export type GetSurpriseBoxByIdInput = z.infer<typeof getSurpriseBoxByIdInputSchema>;

export const getUserOrdersInputSchema = z.object({
  userId: z.string().uuid()
});

export type GetUserOrdersInput = z.infer<typeof getUserOrdersInputSchema>;

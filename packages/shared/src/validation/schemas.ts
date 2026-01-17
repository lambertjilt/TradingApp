import { z } from 'zod';

// User validation schemas
export const UserRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Order validation schemas
export const PlaceOrderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  type: z.enum(['BUY', 'SELL'], { errorMap: () => ({ message: 'Type must be BUY or SELL' }) }),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
});

// Portfolio validation schemas
export const UpdatePortfolioSchema = z.object({
  totalBalance: z.number().optional(),
  availableBalance: z.number().optional(),
});

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const PriceHistoryQuerySchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  interval: z.enum(['1m', '5m', '15m', '1h', '1d']).default('1d'),
});

export type UserRegister = z.infer<typeof UserRegisterSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type PlaceOrder = z.infer<typeof PlaceOrderSchema>;

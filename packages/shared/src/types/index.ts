// User related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Portfolio related types
export interface Portfolio {
  id: string;
  userId: string;
  totalBalance: number;
  availableBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currentValue: number;
  updatedAt: Date;
}

export interface PortfolioOverview {
  portfolio: Portfolio;
  holdings: Holding[];
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
}

// Order related types
export type OrderType = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  type: OrderType;
  quantity: number;
  price: number;
  status: OrderStatus;
  filledQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaceOrderRequest {
  symbol: string;
  type: OrderType;
  quantity: number;
  price: number;
}

// Price related types
export interface PriceData {
  symbol: string;
  current: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
}

export interface PriceHistory {
  symbol: string;
  data: PricePoint[];
}

export interface PricePoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// WebSocket related types
export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: Date;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

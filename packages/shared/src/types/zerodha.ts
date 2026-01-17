// Zerodha Trading Data Types
export interface ZerodhaLoginConfig {
  apiKey: string;
  accessToken: string;
  publicToken: string;
  userId: string;
}

export interface ZerodhaInstrument {
  instrumentToken: number;
  exchangeToken: number;
  tradingsymbol: string;
  name: string;
  lastPrice: number;
  expiry?: string;
  strike?: number;
  tickSize: number;
  lotSize: number;
}

export interface ZerodhaQuote {
  instrumentToken: number;
  lastPrice: number;
  lastQuantity: number;
  lastTradedTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bid: number;
  ask: number;
  bidQty: number;
  askQty: number;
}

export interface ZerodhaPosition {
  instrumentToken: number;
  tradingsymbol: string;
  quantity: number;
  buyQuantity: number;
  sellQuantity: number;
  buyPrice: number;
  sellPrice: number;
  averagePrice: number;
  overnightQuantity: number;
  dayQuantity: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
  pnlPercent: number;
}

export interface ZerodhaOrder {
  orderId: string;
  exchangeOrderId?: string;
  tradingsymbol: string;
  exchange: string;
  orderTimestamp: string;
  kind: string;
  status: 'PENDING' | 'COMPLETE' | 'CANCELLED' | 'REJECTED' | 'MODIFY_PENDING';
  statusMessage?: string;
  orderType: 'REGULAR' | 'BRACKET' | 'COVER';
  transactionType: 'BUY' | 'SELL';
  variety: 'regular' | 'amo' | 'at-the-market';
  quantity: number;
  filledQuantity: number;
  price: number;
  pricetype: 'LIMIT' | 'MARKET' | 'SL' | 'SL-M';
  triggerPrice: number;
  parentOrderId?: string;
  disclosedQuantity: number;
  tag?: string;
}

export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL';
  entry: number;
  target: number;
  stoploss: number;
  quantity: number;
  confidence: number; // 0-100
  reason: string;
  timestamp: Date;
}

export interface AutomaticTrade {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stoplossPrice: number;
  quantity: number;
  entryOrderId?: string;
  targetOrderId?: string;
  stoplossOrderId?: string;
  status: 'PENDING' | 'ENTRY_FILLED' | 'TARGET_HIT' | 'STOPLOSS_HIT' | 'CANCELLED';
  profit?: number;
  profitPercent?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignalStrategy {
  name: string;
  type: 'MA_CROSSOVER' | 'RSI' | 'MACD' | 'BOLLINGER' | 'CUSTOM';
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface TradeConfig {
  maxPositionSize: number;
  maxLossPercent: number;
  minRiskRewardRatio: number;
  autoExecute: boolean;
  stoplossBracketOrder: boolean;
  riskPerTrade: number;
}

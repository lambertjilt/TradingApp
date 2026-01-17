import { z } from 'zod';

// Zerodha authentication
export const ZerodhaLoginSchema = z.object({
  apiKey: z.string().min(1),
  requestToken: z.string().min(1),
  secret: z.string().min(1),
});

// Trading signal generation
export const TradingSignalSchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  action: z.enum(['BUY', 'SELL']),
  entry: z.number().positive(),
  target: z.number().positive(),
  stoploss: z.number().positive(),
  quantity: z.number().int().positive(),
  confidence: z.number().min(0).max(100),
  reason: z.string(),
});

// Automatic trade configuration
export const AutomaticTradeConfigSchema = z.object({
  maxPositionSize: z.number().positive(),
  maxLossPercent: z.number().min(0).max(100),
  minRiskRewardRatio: z.number().positive(),
  autoExecute: z.boolean().default(true),
  stoplossBracketOrder: z.boolean().default(true),
  riskPerTrade: z.number().positive(),
});

// Signal strategy
export const SignalStrategySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['MA_CROSSOVER', 'RSI', 'MACD', 'BOLLINGER', 'CUSTOM']),
  parameters: z.record(z.any()),
  enabled: z.boolean().default(true),
});

export type TradingSignal = z.infer<typeof TradingSignalSchema>;
export type AutomaticTradeConfig = z.infer<typeof AutomaticTradeConfigSchema>;
export type SignalStrategy = z.infer<typeof SignalStrategySchema>;

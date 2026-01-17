import { ZerodhaClient } from './zerodha-client';
import { AutomaticTrade, TradingSignal } from '@trading-app/shared';

export class SignalDetectionService {
  /**
   * Moving Average Crossover Strategy
   */
  static detectMAcrossover(
    candles: any[],
    shortMA: number = 9,
    longMA: number = 21
  ): 'BUY' | 'SELL' | null {
    if (candles.length < longMA + 1) return null;

    const closes = candles.map(c => c.close);

    // Calculate Moving Averages
    const shortAvg = this.calculateMA(closes, shortMA);
    const longAvg = this.calculateMA(closes, longMA);

    const prevShortAvg = this.calculateMA(closes.slice(0, -1), shortMA);
    const prevLongAvg = this.calculateMA(closes.slice(0, -1), longMA);

    // Crossover detection
    if (prevShortAvg <= prevLongAvg && shortAvg > longAvg) {
      return 'BUY';
    }
    if (prevShortAvg >= prevLongAvg && shortAvg < longAvg) {
      return 'SELL';
    }

    return null;
  }

  /**
   * RSI Strategy
   */
  static detectRSI(candles: any[], period: number = 14): 'BUY' | 'SELL' | null {
    if (candles.length < period + 1) return null;

    const rsi = this.calculateRSI(candles, period);

    if (rsi < 30) return 'BUY'; // Oversold
    if (rsi > 70) return 'SELL'; // Overbought

    return null;
  }

  /**
   * MACD Strategy
   */
  static detectMACD(candles: any[]): 'BUY' | 'SELL' | null {
    if (candles.length < 26) return null;

    const closes = candles.map(c => c.close);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;

    const prevCloses = closes.slice(0, -1);
    const prevEMA12 = this.calculateEMA(prevCloses, 12);
    const prevEMA26 = this.calculateEMA(prevCloses, 26);
    const prevMACD = prevEMA12 - prevEMA26;

    const signal = this.calculateEMA([macd], 9);
    const prevSignal = this.calculateEMA([prevMACD], 9);

    if (prevMACD <= prevSignal && macd > signal) {
      return 'BUY';
    }
    if (prevMACD >= prevSignal && macd < signal) {
      return 'SELL';
    }

    return null;
  }

  /**
   * Bollinger Bands Strategy
   */
  static detectBollingerBands(
    candles: any[],
    period: number = 20,
    deviation: number = 2
  ): 'BUY' | 'SELL' | null {
    if (candles.length < period) return null;

    const closes = candles.map(c => c.close);
    const lastPrice = closes[closes.length - 1];

    const sma = this.calculateMA(closes, period);
    const std = this.calculateStdDev(closes.slice(-period), sma);

    const upperBand = sma + deviation * std;
    const lowerBand = sma - deviation * std;

    if (lastPrice <= lowerBand) return 'BUY';
    if (lastPrice >= upperBand) return 'SELL';

    return null;
  }

  // Utility functions
  private static calculateMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  private static calculateRSI(candles: any[], period: number): number {
    const closes = candles.map(c => c.close);
    const changes = closes.slice(1).map((c, i) => c - closes[i]);

    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));

    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

    const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  private static calculateStdDev(prices: number[], mean: number): number {
    const squareDiff = prices.map(p => Math.pow(p - mean, 2));
    const avgSquareDiff = squareDiff.reduce((a, b) => a + b, 0) / prices.length;
    return Math.sqrt(avgSquareDiff);
  }
}

export class TradingEngineService {
  private zerodhaClient: ZerodhaClient;
  private activeTrades: Map<string, AutomaticTrade> = new Map();

  constructor(zerodhaClient: ZerodhaClient) {
    this.zerodhaClient = zerodhaClient;
  }

  /**
   * Execute automatic trade based on signal
   */
  async executeSignal(signal: TradingSignal): Promise<AutomaticTrade | null> {
    try {
      // Validate risk/reward ratio
      const riskReward = this.calculateRiskReward(
        signal.entry,
        signal.target,
        signal.stoploss
      );

      if (riskReward < 1.5) {
        console.log(`Risk/reward ratio too low: ${riskReward}`);
        return null;
      }

      // Place bracket order
      const orderResponse = await this.zerodhaClient.placeBracketOrder(
        signal.symbol,
        signal.action,
        signal.quantity,
        signal.entry,
        signal.target,
        signal.stoploss
      );

      // Create trade record
      const trade: AutomaticTrade = {
        id: `TRADE_${Date.now()}`,
        symbol: signal.symbol,
        action: signal.action,
        entryPrice: signal.entry,
        targetPrice: signal.target,
        stoplossPrice: signal.stoploss,
        quantity: signal.quantity,
        entryOrderId: orderResponse?.order_id,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.activeTrades.set(trade.id, trade);
      return trade;
    } catch (error) {
      console.error('Error executing signal:', error);
      return null;
    }
  }

  /**
   * Monitor active trades and update status
   */
  async monitorTrades(): Promise<void> {
    try {
      const orders = await this.zerodhaClient.getOrders();
      const trades = await this.zerodhaClient.getTrades();

      for (const [tradeId, trade] of this.activeTrades) {
        const matchingOrder = orders.find(
          o => o.order_id === trade.entryOrderId
        );

        if (matchingOrder) {
          if (matchingOrder.status === 'COMPLETE') {
            trade.status = 'ENTRY_FILLED';
            trade.updatedAt = new Date();

            // Calculate actual profit/loss if trade is closed
            const closingTrade = trades.find(t => t.order_id === trade.entryOrderId);
            if (closingTrade) {
              trade.profit = (closingTrade.price - trade.entryPrice) * trade.quantity;
              trade.profitPercent = ((closingTrade.price - trade.entryPrice) / trade.entryPrice) * 100;
            }
          } else if (matchingOrder.status === 'CANCELLED' || matchingOrder.status === 'REJECTED') {
            trade.status = 'CANCELLED';
            trade.updatedAt = new Date();
          }
        }
      }
    } catch (error) {
      console.error('Error monitoring trades:', error);
    }
  }

  /**
   * Calculate risk/reward ratio
   */
  private calculateRiskReward(entry: number, target: number, stoploss: number): number {
    const reward = Math.abs(target - entry);
    const risk = Math.abs(entry - stoploss);
    return risk > 0 ? reward / risk : 0;
  }

  /**
   * Get active trades
   */
  getActiveTrades(): AutomaticTrade[] {
    return Array.from(this.activeTrades.values());
  }

  /**
   * Cancel a trade
   */
  async cancelTrade(tradeId: string): Promise<boolean> {
    try {
      const trade = this.activeTrades.get(tradeId);
      if (!trade || !trade.entryOrderId) return false;

      await this.zerodhaClient.cancelOrder(trade.entryOrderId);
      trade.status = 'CANCELLED';
      trade.updatedAt = new Date();

      return true;
    } catch (error) {
      console.error('Error cancelling trade:', error);
      return false;
    }
  }
}

export default TradingEngineService;

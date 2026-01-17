import { ZerodhaClient } from './zerodha-client';
import { UltimateStrategy, UltimateStrategySignal } from './ultimate-strategy';

export interface AutomaticTradeConfig {
  symbol: string;
  instrumentToken: number;
  quantity: number;
  minConfidence: number; // 80%+
  maxRiskPerTrade: number; // Risk per trade in %
  maxOpenTrades: number; // Maximum concurrent trades
}

export interface ExecutedTrade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  quantity: number;
  target: number;
  stoploss: number;
  orderId: string;
  status: 'PENDING' | 'EXECUTED' | 'FILLED' | 'CANCELLED' | 'CLOSED';
  confidence: number;
  createdAt: Date;
  closedAt?: Date;
  exitPrice?: number;
  pnl?: number;
}

export class AutomaticTradeExecutor {
  private zerodhaClient: ZerodhaClient;
  private ultimateStrategy: UltimateStrategy;
  private activeTrades: Map<string, ExecutedTrade> = new Map();
  private config: AutomaticTradeConfig;

  constructor(zerodhaClient: ZerodhaClient, config: AutomaticTradeConfig) {
    this.zerodhaClient = zerodhaClient;
    this.ultimateStrategy = new UltimateStrategy(zerodhaClient);
    this.config = config;
  }

  /**
   * Main execution loop - runs periodically to check signals and execute trades
   */
  async executeTradeSignals(): Promise<ExecutedTrade | null> {
    try {
      // Check if we can open more trades
      if (this.activeTrades.size >= this.config.maxOpenTrades) {
        console.log(`Max open trades (${this.config.maxOpenTrades}) reached`);
        return null;
      }

      // Analyze the symbol using ultimate strategy
      const signal = await this.ultimateStrategy.analyzeSymbol(
        this.config.instrumentToken,
        this.config.symbol,
        this.config.quantity
      );

      console.log(`Signal for ${this.config.symbol}:`, {
        signal: signal.signal,
        confidence: signal.confidence,
        matchedSignals: signal.signals_matched.length,
      });

      // Check if signal meets confidence threshold
      if (!signal.signal || signal.confidence < this.config.minConfidence) {
        console.log(
          `Signal rejected: ${this.config.symbol} - Confidence ${signal.confidence.toFixed(2)}% (min: ${this.config.minConfidence}%)`
        );
        return null;
      }

      // Execute the trade (signal is guaranteed to be 'BUY' or 'SELL' here)
      const trade = await this.executeTrade(signal as UltimateStrategySignal & { signal: 'BUY' | 'SELL' });
      return trade;
    } catch (error) {
      console.error('Error executing trade signals:', error);
      throw error;
    }
  }

  /**
   * Execute a single trade based on signal
   */
  private async executeTrade(signal: UltimateStrategySignal & { signal: 'BUY' | 'SELL' }): Promise<ExecutedTrade> {
    try {
      console.log(`Executing ${signal.signal} trade for ${signal.symbol}`);

      // Place bracket order with target and stoploss
      const orderResponse = await this.zerodhaClient.placeBracketOrder({
        symbol: signal.symbol,
        quantity: this.config.quantity,
        side: signal.signal,
        price: signal.price,
        target: signal.target,
        stoploss: signal.stoploss,
      });

      const trade: ExecutedTrade = {
        id: `${signal.symbol}_${Date.now()}`,
        symbol: signal.symbol,
        type: signal.signal,
        entryPrice: signal.price,
        quantity: this.config.quantity,
        target: signal.target,
        stoploss: signal.stoploss,
        orderId: orderResponse.order_id,
        status: 'EXECUTED',
        confidence: signal.confidence,
        createdAt: new Date(),
      };

      // Store active trade
      this.activeTrades.set(trade.id, trade);

      console.log(`Trade executed successfully:`, {
        id: trade.id,
        symbol: trade.symbol,
        type: trade.type,
        entry: trade.entryPrice,
        target: trade.target,
        stoploss: trade.stoploss,
        confidence: `${trade.confidence.toFixed(2)}%`,
      });

      return trade;
    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  /**
   * Monitor active trades and update their status
   */
  async monitorActiveTrades(): Promise<ExecutedTrade[]> {
    const closedTrades: ExecutedTrade[] = [];

    for (const [tradeId, trade] of this.activeTrades) {
      try {
        // Get current position data
        const positions = await this.zerodhaClient.getPositions();
        const position = positions.find((p: any) => p.instrument_token === this.config.instrumentToken);

        if (!position) {
          // Trade already closed
          trade.status = 'CLOSED';
          trade.closedAt = new Date();
          this.activeTrades.delete(tradeId);
          closedTrades.push(trade);
          continue;
        }

        // Update trade status
        if (position.quantity === 0) {
          trade.status = 'FILLED';
        }
      } catch (error) {
        console.error(`Error monitoring trade ${tradeId}:`, error);
      }
    }

    return closedTrades;
  }

  /**
   * Get all active trades
   */
  getActiveTrades(): ExecutedTrade[] {
    return Array.from(this.activeTrades.values());
  }

  /**
   * Get trade history
   */
  async getTradeHistory(): Promise<ExecutedTrade[]> {
    // This would typically fetch from database
    // For now, returning active trades as example
    return this.getActiveTrades();
  }

  /**
   * Close a trade manually
   */
  async closeTrade(tradeId: string): Promise<boolean> {
    try {
      const trade = this.activeTrades.get(tradeId);
      if (!trade) {
        throw new Error(`Trade ${tradeId} not found`);
      }

      // Get current price to calculate exit
      const quote = await this.zerodhaClient.getQuote([this.config.instrumentToken]);
      const exitPrice = quote[this.config.instrumentToken]?.last_price || 0;

      // Calculate PnL
      let pnl = 0;
      if (trade.type === 'BUY') {
        pnl = (exitPrice - trade.entryPrice) * trade.quantity;
      } else {
        pnl = (trade.entryPrice - exitPrice) * trade.quantity;
      }

      // Update trade
      trade.status = 'CLOSED';
      trade.exitPrice = exitPrice;
      trade.pnl = pnl;
      trade.closedAt = new Date();

      // Cancel the order in Zerodha
      await this.zerodhaClient.cancelOrder(trade.orderId);

      this.activeTrades.delete(tradeId);

      console.log(`Trade closed: ${tradeId}`, {
        entry: trade.entryPrice,
        exit: exitPrice,
        pnl,
      });

      return true;
    } catch (error) {
      console.error(`Error closing trade ${tradeId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate total profit/loss
   */
  calculateTotalPnL(): number {
    let totalPnL = 0;
    this.activeTrades.forEach((trade) => {
      if (trade.pnl) {
        totalPnL += trade.pnl;
      }
    });
    return totalPnL;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const trades = Array.from(this.activeTrades.values());
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const profitableTrades = closedTrades.filter((t) => t.pnl && t.pnl > 0);
    const totalPnL = this.calculateTotalPnL();

    const winRate =
      closedTrades.length > 0
        ? (profitableTrades.length / closedTrades.length) * 100
        : 0;

    const avgConfidence =
      trades.length > 0
        ? trades.reduce((sum, t) => sum + t.confidence, 0) / trades.length
        : 0;

    return {
      activeTradesCount: trades.filter((t) => t.status !== 'CLOSED').length,
      closedTradesCount: closedTrades.length,
      profitableTradesCount: profitableTrades.length,
      winRate: winRate.toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      avgConfidence: avgConfidence.toFixed(2),
    };
  }
}

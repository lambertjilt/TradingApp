import { ZerodhaClient } from './zerodha-client';
import { SignalDetectionService } from './trading-engine';

export interface UltimateStrategySignal {
  symbol: string;
  instrumentToken: number;
  signal: 'BUY' | 'SELL' | null;
  confidence: number; // 0-100
  signals_matched: string[];
  timestamp: Date;
  price: number;
  target: number;
  stoploss: number;
  risk_reward_ratio: number;
}

export class UltimateStrategy {
  private zerodhaClient: ZerodhaClient;
  private minConfidenceThreshold = 80; // 80% confidence minimum

  constructor(zerodhaClient: ZerodhaClient) {
    this.zerodhaClient = zerodhaClient;
  }

  /**
   * Ultimate Strategy - Combines multiple indicators for high accuracy
   * Uses consensus-based approach where multiple signals must align
   */
  async analyzeSymbol(
    instrumentToken: number,
    symbol: string,
    quantity: number = 1
  ): Promise<UltimateStrategySignal> {
    try {
      // Fetch 1-hour candles (last 50 candles for analysis)
      const candles1h = await this.zerodhaClient.getHistoricalData(
        instrumentToken,
        'hour',
        this.getDateBefore(2), // 2 days back
        new Date().toISOString()
      );

      // Fetch 15-minute candles for confirmation
      const candles15m = await this.zerodhaClient.getHistoricalData(
        instrumentToken,
        '15minute',
        this.getDateBefore(1), // 1 day back
        new Date().toISOString()
      );

      // Get current price
      const quote = await this.zerodhaClient.getQuote([instrumentToken]);
      const currentPrice = quote[instrumentToken]?.last_price || 0;

      // Run all analysis signals
      const signals = this.runAllSignals(candles1h, candles15m);

      // Calculate confidence based on signal agreement
      const { confidence, matchedSignals } = this.calculateConfidence(signals);

      // Determine final signal
      const finalSignal = this.determineFinalSignal(signals, confidence);

      // Calculate risk management levels
      const { target, stoploss } = this.calculateRiskManagement(
        currentPrice,
        finalSignal,
        candles1h
      );

      const riskRewardRatio = this.calculateRiskReward(currentPrice, target, stoploss);

      return {
        symbol,
        instrumentToken,
        signal: finalSignal,
        confidence,
        signals_matched: matchedSignals,
        timestamp: new Date(),
        price: currentPrice,
        target,
        stoploss,
        risk_reward_ratio: riskRewardRatio,
      };
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Run all analysis signals
   */
  private runAllSignals(candles1h: any[], candles15m: any[]) {
    return {
      // Primary signals from 1-hour chart
      maCrossover_1h: SignalDetectionService.detectMAcrossover(candles1h, 9, 21),
      rsi_1h: SignalDetectionService.detectRSI(candles1h, 14),
      macd_1h: SignalDetectionService.detectMACD(candles1h),
      bollingerBands_1h: SignalDetectionService.detectBollingerBands(candles1h),

      // Confirmation signals from 15-minute chart
      maCrossover_15m: SignalDetectionService.detectMAcrossover(candles15m, 5, 13),
      rsi_15m: SignalDetectionService.detectRSI(candles15m, 14),
      macd_15m: SignalDetectionService.detectMACD(candles15m),

      // Volume analysis
      volumeConfirmation: this.analyzeVolume(candles1h),

      // Trend strength
      trendStrength: this.analyzeTrendStrength(candles1h),

      // Support/Resistance
      srBounce: this.analyzeSupportResistance(candles1h),
    };
  }

  /**
   * Calculate confidence based on signal agreement
   */
  private calculateConfidence(signals: any) {
    let buySignals = 0;
    let sellSignals = 0;
    const matchedSignals: string[] = [];

    Object.entries(signals).forEach(([key, value]) => {
      if (value === 'BUY') {
        buySignals++;
        matchedSignals.push(key);
      } else if (value === 'SELL') {
        sellSignals++;
        matchedSignals.push(key);
      }
    });

    const totalSignals = Object.keys(signals).length;
    let confidence = 0;

    // Confidence = (matching signals / total signals) * 100
    if (buySignals > sellSignals) {
      confidence = (buySignals / totalSignals) * 100;
    } else if (sellSignals > buySignals) {
      confidence = (sellSignals / totalSignals) * 100;
    }

    return { confidence, matchedSignals };
  }

  /**
   * Determine final signal based on confidence threshold
   */
  private determineFinalSignal(signals: any, confidence: number) {
    if (confidence < this.minConfidenceThreshold) {
      return null; // Not confident enough
    }

    let buySignals = 0;
    let sellSignals = 0;

    Object.values(signals).forEach((value: any) => {
      if (value === 'BUY') buySignals++;
      else if (value === 'SELL') sellSignals++;
    });

    if (buySignals > sellSignals) return 'BUY';
    if (sellSignals > buySignals) return 'SELL';
    return null;
  }

  /**
   * Analyze volume confirmation
   */
  private analyzeVolume(candles: any[]): 'BUY' | 'SELL' | null {
    if (candles.length < 2) return null;

    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    const avgVolume = candles.slice(-10).reduce((sum, c) => sum + c.volume, 0) / 10;

    // High volume with up candle = BUY
    if (
      lastCandle.close > lastCandle.open &&
      lastCandle.volume > avgVolume * 1.5
    ) {
      return 'BUY';
    }

    // High volume with down candle = SELL
    if (
      lastCandle.close < lastCandle.open &&
      lastCandle.volume > avgVolume * 1.5
    ) {
      return 'SELL';
    }

    return null;
  }

  /**
   * Analyze trend strength
   */
  private analyzeTrendStrength(candles: any[]): 'BUY' | 'SELL' | null {
    if (candles.length < 5) return null;

    const lastCandles = candles.slice(-5);
    const higherHighs = lastCandles
      .slice(1)
      .filter((c, i) => c.high > lastCandles[i].high).length;
    const higherLows = lastCandles
      .slice(1)
      .filter((c, i) => c.low > lastCandles[i].low).length;
    const lowerHighs = lastCandles
      .slice(1)
      .filter((c, i) => c.high < lastCandles[i].high).length;
    const lowerLows = lastCandles
      .slice(1)
      .filter((c, i) => c.low < lastCandles[i].low).length;

    if (higherHighs >= 3 && higherLows >= 3) return 'BUY';
    if (lowerHighs >= 3 && lowerLows >= 3) return 'SELL';

    return null;
  }

  /**
   * Analyze support/resistance bounces
   */
  private analyzeSupportResistance(candles: any[]): 'BUY' | 'SELL' | null {
    if (candles.length < 20) return null;

    const closes = candles.map(c => c.close);
    const minClose = Math.min(...closes.slice(-20));
    const maxClose = Math.max(...closes.slice(-20));
    const currentClose = closes[closes.length - 1];

    // Bounce from support
    if (Math.abs(currentClose - minClose) < (maxClose - minClose) * 0.05) {
      return 'BUY';
    }

    // Touch resistance
    if (Math.abs(currentClose - maxClose) < (maxClose - minClose) * 0.05) {
      return 'SELL';
    }

    return null;
  }

  /**
   * Calculate target and stoploss based on ATR (Average True Range)
   */
  private calculateRiskManagement(
    currentPrice: number,
    signal: 'BUY' | 'SELL' | null,
    candles: any[]
  ): { target: number; stoploss: number } {
    const atr = this.calculateATR(candles);
    const riskFactor = 2; // 2 ATR for target, 1 ATR for stoploss

    if (signal === 'BUY') {
      return {
        target: currentPrice + atr * riskFactor,
        stoploss: currentPrice - atr,
      };
    } else if (signal === 'SELL') {
      return {
        target: currentPrice - atr * riskFactor,
        stoploss: currentPrice + atr,
      };
    }

    return { target: 0, stoploss: 0 };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  private calculateATR(candles: any[], period: number = 14): number {
    if (candles.length < period) return 0;

    let tr = 0;
    const trList = [];

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;

      tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trList.push(tr);
    }

    const atr = trList.slice(-period).reduce((a, b) => a + b, 0) / period;
    return atr;
  }

  /**
   * Calculate Risk/Reward Ratio
   */
  private calculateRiskReward(
    currentPrice: number,
    target: number,
    stoploss: number
  ): number {
    if (stoploss === 0 || stoploss === currentPrice) return 0;

    const reward = Math.abs(target - currentPrice);
    const risk = Math.abs(currentPrice - stoploss);

    return reward / risk;
  }

  /**
   * Get date string for API calls
   */
  private getDateBefore(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

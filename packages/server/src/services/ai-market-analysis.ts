/**
 * Advanced AI Market Analysis Service
 * Combines technical indicators with ML algorithms for market prediction
 */

export interface MarketAnalysisResult {
  symbol: string;
  timeframe: string;
  trend: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  aiScore: number; // 0-100
  technicalScore: number; // 0-100
  sentimentScore: number; // -100 to 100
  volatility: number;
  momentum: number;
  patterns: string[];
  signals: {
    price: number;
    ma20: number;
    ma50: number;
    ma200: number;
    rsi: number;
    macd: number;
    bollingerUpper: number;
    bollingerLower: number;
    atr: number;
  };
  predictedDirection: 'UP' | 'DOWN';
  predictedProbability: number;
  recommendations: string[];
}

export class AIMarketAnalysisService {
  /**
   * Comprehensive market analysis using AI + Technical Analysis
   */
  static analyzeMarket(candles: any[], symbol: string = 'UNKNOWN'): MarketAnalysisResult {
    if (candles.length < 50) {
      throw new Error('Insufficient data for analysis. Need at least 50 candles.');
    }

    // Calculate all signals
    const signals = this.calculateAllSignals(candles);
    const technicalScore = this.calculateTechnicalScore(signals, candles);
    const aiScore = this.calculateAIScore(candles, signals);
    const sentimentScore = this.calculateSentimentScore(candles);
    const patterns = this.detectPatterns(candles);
    const volatility = this.calculateVolatility(candles);
    const momentum = this.calculateMomentum(candles);

    // AI Prediction
    const { direction, probability } = this.predictMarketDirection(
      candles,
      signals,
      aiScore,
      technicalScore
    );

    // Determine overall trend
    const trend = this.determineTrend(aiScore, technicalScore, sentimentScore);

    // Calculate confidence
    const confidence = this.calculateConfidence(aiScore, technicalScore, patterns);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      trend,
      signals,
      patterns,
      volatility,
      momentum
    );

    return {
      symbol,
      timeframe: '1H',
      trend,
      confidence,
      aiScore,
      technicalScore,
      sentimentScore,
      volatility,
      momentum,
      patterns,
      signals,
      predictedDirection: direction,
      predictedProbability: probability,
      recommendations,
    };
  }

  /**
   * Calculate all technical signals
   */
  private static calculateAllSignals(candles: any[]) {
    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);

    return {
      price: closes[closes.length - 1],
      ma20: this.calculateMA(closes, 20),
      ma50: this.calculateMA(closes, 50),
      ma200: this.calculateMA(closes, 200),
      rsi: this.calculateRSI(closes),
      macd: this.calculateMACD(closes),
      bollingerUpper: this.calculateBollingerUpper(closes),
      bollingerLower: this.calculateBollingerLower(closes),
      atr: this.calculateATR(candles),
    };
  }

  /**
   * Calculate technical analysis score (0-100)
   */
  private static calculateTechnicalScore(signals: any, candles: any[]): number {
    let score = 50; // Neutral base

    // Moving Average alignment
    if (
      signals.price > signals.ma20 &&
      signals.ma20 > signals.ma50 &&
      signals.ma50 > signals.ma200
    ) {
      score += 20; // Strong uptrend
    } else if (
      signals.price < signals.ma20 &&
      signals.ma20 < signals.ma50 &&
      signals.ma50 < signals.ma200
    ) {
      score -= 20; // Strong downtrend
    }

    // RSI analysis
    if (signals.rsi < 30) {
      score += 15; // Oversold
    } else if (signals.rsi > 70) {
      score -= 15; // Overbought
    } else if (signals.rsi > 45 && signals.rsi < 55) {
      score += 5; // Neutral momentum
    }

    // MACD analysis
    if (signals.macd > 0) {
      score += 10;
    } else {
      score -= 10;
    }

    // Price relative to Bollinger Bands
    if (signals.price > signals.bollingerUpper) {
      score -= 10; // Above upper band
    } else if (signals.price < signals.bollingerLower) {
      score += 10; // Below lower band
    }

    // Volume analysis
    const avgVolume = candles.slice(-10).reduce((sum, c) => sum + c.volume, 0) / 10;
    const lastVolume = candles[candles.length - 1].volume;
    if (lastVolume > avgVolume * 1.5) {
      score += 5; // High volume confirmation
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate AI score using pattern recognition (0-100)
   */
  private static calculateAIScore(candles: any[], signals: any): number {
    let score = 50;

    const closes = candles.map((c) => c.close);

    // Trend strength
    const upCandles = candles
      .slice(-10)
      .filter((c) => c.close > c.open).length;
    if (upCandles > 7) {
      score += 15;
    } else if (upCandles < 3) {
      score -= 15;
    }

    // Volatility contraction (often before big moves)
    const recentVolatility = this.calculateVolatility(candles.slice(-20));
    const historicalVolatility = this.calculateVolatility(candles.slice(-50));

    if (recentVolatility < historicalVolatility * 0.7) {
      score += 10; // Low volatility = potential breakout
    }

    // Support/Resistance bounce
    const min20 = Math.min(...closes.slice(-20));
    const max20 = Math.max(...closes.slice(-20));
    const current = closes[closes.length - 1];

    if (Math.abs(current - min20) < (max20 - min20) * 0.05) {
      score += 12; // Near support
    } else if (Math.abs(current - max20) < (max20 - min20) * 0.05) {
      score -= 12; // Near resistance
    }

    // Rate of Change
    const roc = ((closes[closes.length - 1] - closes[closes.length - 10]) /
      closes[closes.length - 10]) * 100;
    if (Math.abs(roc) > 5) {
      score += 8;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate sentiment score (-100 to 100)
   */
  private static calculateSentimentScore(candles: any[]): number {
    const closes = candles.map((c) => c.close);
    const upMoves = candles.slice(1).filter((c, i) => c.close > candles[i].close).length;
    const downMoves = candles.slice(1).filter((c, i) => c.close < candles[i].close).length;

    const upPercent = (upMoves / (upMoves + downMoves)) * 100;

    // Convert to -100 to 100 scale
    return (upPercent - 50) * 2;
  }

  /**
   * Detect chart patterns
   */
  private static detectPatterns(candles: any[]): string[] {
    const patterns: string[] = [];
    const closes = candles.map((c) => c.close);

    // Double Bottom
    if (
      closes[closes.length - 1] > closes[closes.length - 2] &&
      closes[closes.length - 2] < closes[closes.length - 3]
    ) {
      patterns.push('DOUBLE_BOTTOM');
    }

    // Double Top
    if (
      closes[closes.length - 1] < closes[closes.length - 2] &&
      closes[closes.length - 2] > closes[closes.length - 3]
    ) {
      patterns.push('DOUBLE_TOP');
    }

    // Higher Highs & Highs (Uptrend)
    const recent5 = closes.slice(-5);
    if (
      recent5[4] > recent5[3] &&
      recent5[3] > recent5[2] &&
      recent5[2] > recent5[1]
    ) {
      patterns.push('HIGHER_HIGHS');
    }

    // Lower Highs & Lows (Downtrend)
    if (
      recent5[4] < recent5[3] &&
      recent5[3] < recent5[2] &&
      recent5[2] < recent5[1]
    ) {
      patterns.push('LOWER_HIGHS');
    }

    // Bullish Engulfing
    if (
      candles[candles.length - 1].close > candles[candles.length - 1].open &&
      candles[candles.length - 2].close < candles[candles.length - 2].open &&
      candles[candles.length - 1].open < candles[candles.length - 2].close
    ) {
      patterns.push('BULLISH_ENGULFING');
    }

    // Bearish Engulfing
    if (
      candles[candles.length - 1].close < candles[candles.length - 1].open &&
      candles[candles.length - 2].close > candles[candles.length - 2].open &&
      candles[candles.length - 1].open > candles[candles.length - 2].close
    ) {
      patterns.push('BEARISH_ENGULFING');
    }

    return patterns;
  }

  /**
   * Calculate market volatility
   */
  private static calculateVolatility(candles: any[]): number {
    const closes = candles.map((c) => c.close);
    const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev * 100; // Volatility as percentage
  }

  /**
   * Calculate momentum
   */
  private static calculateMomentum(candles: any[]): number {
    const closes = candles.map((c) => c.close);
    const momentum = closes[closes.length - 1] - closes[Math.max(0, closes.length - 10)];
    return momentum;
  }

  /**
   * Predict market direction using ML-like algorithm
   */
  private static predictMarketDirection(
    candles: any[],
    signals: any,
    aiScore: number,
    technicalScore: number
  ): { direction: 'UP' | 'DOWN'; probability: number } {
    const closes = candles.map((c) => c.close);

    // Combined score
    const combinedScore = (aiScore * 0.5 + technicalScore * 0.5 + signals.rsi) / 3;

    // Probability calculation
    let probability = Math.abs(combinedScore - 50) / 50;

    // Adjust for recent trend
    const recentTrend =
      (closes[closes.length - 1] - closes[Math.max(0, closes.length - 5)]) /
      closes[Math.max(0, closes.length - 5)];

    if (recentTrend > 0) {
      probability += 10;
    } else {
      probability -= 10;
    }

    probability = Math.max(0.5, Math.min(0.99, probability));

    const direction = combinedScore > 50 ? 'UP' : 'DOWN';

    return { direction, probability: probability * 100 };
  }

  /**
   * Determine overall trend
   */
  private static determineTrend(
    aiScore: number,
    technicalScore: number,
    sentimentScore: number
  ): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' {
    const combinedScore = (aiScore + technicalScore) / 2;

    if (combinedScore > 75 && sentimentScore > 40) {
      return 'STRONG_BUY';
    } else if (combinedScore > 60 && sentimentScore > 20) {
      return 'BUY';
    } else if (combinedScore > 40 && combinedScore < 60) {
      return 'NEUTRAL';
    } else if (combinedScore < 40 && sentimentScore < -20) {
      return 'SELL';
    } else {
      return 'STRONG_SELL';
    }
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(aiScore: number, technicalScore: number, patterns: string[]): number {
    let confidence = (aiScore + technicalScore) / 2;

    // Add pattern confidence
    if (patterns.length > 0) {
      confidence += patterns.length * 5;
    }

    return Math.min(100, confidence);
  }

  /**
   * Generate trading recommendations
   */
  private static generateRecommendations(
    trend: string,
    signals: any,
    patterns: string[],
    volatility: number,
    momentum: number
  ): string[] {
    const recommendations: string[] = [];

    if (trend.includes('BUY')) {
      recommendations.push('Consider BUY position');

      if (volatility < 2) {
        recommendations.push('Low volatility - good entry opportunity');
      }

      if (momentum > 0) {
        recommendations.push('Positive momentum confirmation');
      }

      if (signals.rsi < 40) {
        recommendations.push('RSI showing room for upside');
      }
    } else if (trend.includes('SELL')) {
      recommendations.push('Consider SELL position');

      if (volatility > 4) {
        recommendations.push('High volatility - use wider stops');
      }

      if (momentum < 0) {
        recommendations.push('Negative momentum confirmation');
      }

      if (signals.rsi > 60) {
        recommendations.push('RSI showing weakness');
      }
    } else {
      recommendations.push('Market in consolidation - wait for breakout');
      recommendations.push('Use range trading strategy');
    }

    // Pattern-based recommendations
    if (patterns.includes('BULLISH_ENGULFING')) {
      recommendations.push('Bullish engulfing pattern detected - strong BUY signal');
    }

    if (patterns.includes('BEARISH_ENGULFING')) {
      recommendations.push('Bearish engulfing pattern detected - strong SELL signal');
    }

    if (patterns.includes('DOUBLE_BOTTOM')) {
      recommendations.push('Double bottom pattern - potential reversal UP');
    }

    if (patterns.includes('DOUBLE_TOP')) {
      recommendations.push('Double top pattern - potential reversal DOWN');
    }

    return recommendations;
  }

  // Helper methods
  private static calculateMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  private static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    const changes = prices.slice(1).map((p, i) => p - prices[i]);
    const gains = changes.filter((c) => c > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(changes.filter((c) => c < 0).reduce((a, b) => a + b, 0));

    const avgGain = gains / period;
    const avgLoss = losses / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private static calculateMACD(prices: number[]): number {
    if (prices.length < 26) return 0;

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
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

  private static calculateBollingerUpper(prices: number[], period: number = 20): number {
    if (prices.length < period) return prices[prices.length - 1];

    const sma = this.calculateMA(prices, period);
    const values = prices.slice(-period);
    const variance =
      values.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return sma + 2 * stdDev;
  }

  private static calculateBollingerLower(prices: number[], period: number = 20): number {
    if (prices.length < period) return prices[prices.length - 1];

    const sma = this.calculateMA(prices, period);
    const values = prices.slice(-period);
    const variance =
      values.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return sma - 2 * stdDev;
  }

  private static calculateATR(candles: any[], period: number = 14): number {
    if (candles.length < period) return 0;

    const trs = candles.map((c, i) => {
      if (i === 0) return c.high - c.low;

      const prevClose = candles[i - 1].close;
      const tr1 = c.high - c.low;
      const tr2 = Math.abs(c.high - prevClose);
      const tr3 = Math.abs(c.low - prevClose);

      return Math.max(tr1, tr2, tr3);
    });

    return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
  }
}

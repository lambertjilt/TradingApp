/**
 * Options Trading Service
 * Handles options contracts with weekly and monthly expiry
 */

export type OptionType = 'CE' | 'PE'; // Call Option, Put Option
export type ExpiryType = 'WEEKLY' | 'MONTHLY'; // Weekly or Monthly expiry

export interface OptionContract {
  symbol: string;
  baseSymbol: string; // e.g., RELIANCE
  optionType: OptionType;
  strikePrice: number;
  expiryType: ExpiryType;
  expiryDate: string; // YYYY-MM-DD
  instrumentToken: number;
  currentPrice: number;
  impliedVolatility: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  bid: number;
  ask: number;
  openInterest: number;
  volume: number;
}

export interface OptionsStrategy {
  name: string;
  type: 'BULL_CALL' | 'BEAR_CALL' | 'BULL_PUT' | 'BEAR_PUT' | 'IRON_CONDOR' | 'STRADDLE' | 'STRANGLE';
  description: string;
  maxProfit: number;
  maxLoss: number;
  breakEvenLow: number;
  breakEvenHigh: number;
  contracts: OptionContract[];
  netDebit: number;
  netCredit: number;
}

export class OptionsTradeService {
  /**
   * Get available option strikes for a given symbol
   */
  static getAvailableStrikes(
    basePrice: number,
    strikeInterval: number = 100
  ): number[] {
    const strikes: number[] = [];

    // Generate strikes around current price
    const minStrike = Math.floor(basePrice / strikeInterval) * strikeInterval - 500;
    const maxStrike = Math.ceil(basePrice / strikeInterval) * strikeInterval + 500;

    for (let strike = minStrike; strike <= maxStrike; strike += strikeInterval) {
      if (strike > 0) strikes.push(strike);
    }

    return strikes;
  }

  /**
   * Calculate Greeks for an option (simplified Black-Scholes)
   */
  static calculateGreeks(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number, // in days
    volatility: number,
    riskFreeRate: number = 0.05,
    optionType: OptionType = 'CE'
  ) {
    const T = timeToExpiry / 365;
    const sigma = volatility / 100;
    const r = riskFreeRate;

    // d1 and d2 calculations
    const d1 =
      (Math.log(spotPrice / strikePrice) + (r + (sigma * sigma) / 2) * T) /
      (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    // Normal distribution approximation
    const N_d1 = this.normalDistribution(d1);
    const N_d2 = this.normalDistribution(d2);
    const n_d1 = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-(d1 * d1) / 2);

    // Greeks calculation
    const delta =
      optionType === 'CE'
        ? N_d1
        : N_d1 - 1; // Call or Put delta
    const gamma =
      (n_d1) / (spotPrice * sigma * Math.sqrt(T));
    const theta =
      optionType === 'CE'
        ? (-(spotPrice * n_d1 * sigma) / (2 * Math.sqrt(T)) -
            r * strikePrice * Math.exp(-r * T) * N_d2) /
          365
        : (-(spotPrice * n_d1 * sigma) / (2 * Math.sqrt(T)) +
            r * strikePrice * Math.exp(-r * T) * (1 - N_d2)) /
          365;
    const vega =
      (spotPrice * n_d1 * Math.sqrt(T)) / 100;
    const rho =
      optionType === 'CE'
        ? strikePrice * T * Math.exp(-r * T) * N_d2 / 100
        : -strikePrice * T * Math.exp(-r * T) * (1 - N_d2) / 100;

    return {
      delta: Math.round(delta * 100) / 100,
      gamma: Math.round(gamma * 10000) / 10000,
      theta: Math.round(theta * 100) / 100,
      vega: Math.round(vega * 100) / 100,
      rho: Math.round(rho * 100) / 100,
    };
  }

  /**
   * Create Bull Call Spread (buy call, sell call at higher strike)
   */
  static createBullCallSpread(
    basePrice: number,
    longCall: OptionContract,
    shortCall: OptionContract
  ): OptionsStrategy {
    const maxProfit =
      shortCall.currentPrice - longCall.currentPrice +
      (shortCall.strikePrice - longCall.strikePrice);
    const maxLoss = longCall.currentPrice - shortCall.currentPrice;
    const netDebit = longCall.currentPrice - shortCall.currentPrice;
    const breakEven = longCall.strikePrice + netDebit;

    return {
      name: 'Bull Call Spread',
      type: 'BULL_CALL',
      description: `Buy ${longCall.strikePrice} CE, Sell ${shortCall.strikePrice} CE`,
      maxProfit,
      maxLoss,
      breakEvenLow: breakEven,
      breakEvenHigh: breakEven,
      contracts: [longCall, shortCall],
      netDebit,
      netCredit: 0,
    };
  }

  /**
   * Create Iron Condor (sell call spread + sell put spread)
   */
  static createIronCondor(
    longCall: OptionContract,
    shortCall: OptionContract,
    longPut: OptionContract,
    shortPut: OptionContract
  ): OptionsStrategy {
    const callSpreadWidth = shortCall.strikePrice - longCall.strikePrice;
    const putSpreadWidth = shortPut.strikePrice - longPut.strikePrice;

    const totalCredit =
      shortCall.currentPrice +
      shortPut.currentPrice -
      longCall.currentPrice -
      longPut.currentPrice;

    const maxProfit = totalCredit;
    const maxLoss = Math.max(callSpreadWidth, putSpreadWidth) - totalCredit;

    const lowerBreakEven = shortPut.strikePrice - totalCredit;
    const upperBreakEven = shortCall.strikePrice + totalCredit;

    return {
      name: 'Iron Condor',
      type: 'IRON_CONDOR',
      description: `Sell ${shortCall.strikePrice} CE, Buy ${longCall.strikePrice} CE, Sell ${shortPut.strikePrice} PE, Buy ${longPut.strikePrice} PE`,
      maxProfit,
      maxLoss,
      breakEvenLow: lowerBreakEven,
      breakEvenHigh: upperBreakEven,
      contracts: [longCall, shortCall, longPut, shortPut],
      netDebit: 0,
      netCredit: totalCredit,
    };
  }

  /**
   * Create Straddle (buy call + buy put at same strike)
   */
  static createStraddle(
    call: OptionContract,
    put: OptionContract
  ): OptionsStrategy {
    const totalCost = call.currentPrice + put.currentPrice;
    const lowerBreakEven = call.strikePrice - totalCost;
    const upperBreakEven = put.strikePrice + totalCost;

    return {
      name: 'Long Straddle',
      type: 'STRADDLE',
      description: `Buy ${call.strikePrice} CE, Buy ${put.strikePrice} PE`,
      maxProfit: Infinity,
      maxLoss: totalCost,
      breakEvenLow: lowerBreakEven,
      breakEvenHigh: upperBreakEven,
      contracts: [call, put],
      netDebit: totalCost,
      netCredit: 0,
    };
  }

  /**
   * Calculate option price using Black-Scholes
   */
  static calculateOptionPrice(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number, // in days
    volatility: number,
    riskFreeRate: number = 0.05,
    dividendYield: number = 0,
    optionType: OptionType = 'CE'
  ): number {
    const T = timeToExpiry / 365;
    const sigma = volatility / 100;
    const r = riskFreeRate;
    const q = dividendYield;

    const d1 =
      (Math.log(spotPrice / strikePrice) + (r - q + (sigma * sigma) / 2) * T) /
      (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const N_d1 = this.normalDistribution(d1);
    const N_d2 = this.normalDistribution(d2);
    const N_neg_d1 = 1 - N_d1;
    const N_neg_d2 = 1 - N_d2;

    let price = 0;

    if (optionType === 'CE') {
      // Call option
      price =
        spotPrice * Math.exp(-q * T) * N_d1 -
        strikePrice * Math.exp(-r * T) * N_d2;
    } else {
      // Put option
      price =
        strikePrice * Math.exp(-r * T) * N_neg_d2 -
        spotPrice * Math.exp(-q * T) * N_neg_d1;
    }

    return Math.max(0, price);
  }

  /**
   * Suggest best options strategy based on market analysis
   */
  static suggestStrategy(
    marketTrend: 'BUY' | 'SELL' | 'NEUTRAL',
    volatility: number,
    basePrice: number,
    currentOptions: OptionContract[]
  ): string[] {
    const suggestions: string[] = [];

    if (marketTrend === 'BUY') {
      suggestions.push('BULL_CALL - Good risk/reward in bullish market');

      if (volatility > 30) {
        suggestions.push('BULL_CALL_SPREAD - Reduce cost in high IV environment');
      }
    } else if (marketTrend === 'SELL') {
      suggestions.push('BEAR_CALL - Good risk/reward in bearish market');

      if (volatility > 30) {
        suggestions.push('BEAR_CALL_SPREAD - Reduce cost in high IV environment');
      }
    } else {
      suggestions.push('IRON_CONDOR - Best for range-bound markets');

      if (volatility > 35) {
        suggestions.push('SHORT_STRADDLE - High IV great for selling premium');
      }

      if (volatility < 15) {
        suggestions.push('LONG_STRADDLE - Low IV good for high-risk traders');
      }
    }

    return suggestions;
  }

  /**
   * Get next expiry date
   */
  static getNextExpiryDate(expiryType: ExpiryType): string {
    const today = new Date();
    let expiryDate = new Date(today);

    if (expiryType === 'WEEKLY') {
      // Next Thursday (NSE weekly expiry)
      const daysUntilThursday = (4 - today.getDay() + 7) % 7;
      expiryDate.setDate(today.getDate() + (daysUntilThursday || 7));
    } else {
      // Last Thursday of current month (NSE monthly expiry)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const daysUntilThursday = (4 - lastDay.getDay() + 7) % 7;
      expiryDate = new Date(
        lastDay.getFullYear(),
        lastDay.getMonth(),
        lastDay.getDate() - daysUntilThursday
      );

      // If it's in the past, get next month's expiry
      if (expiryDate < today) {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextLastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
        const nextDaysUntilThursday =
          (4 - nextLastDay.getDay() + 7) % 7;
        expiryDate = new Date(
          nextLastDay.getFullYear(),
          nextLastDay.getMonth(),
          nextLastDay.getDate() - nextDaysUntilThursday
        );
      }
    }

    return expiryDate.toISOString().split('T')[0];
  }

  /**
   * Get days to expiry
   */
  static getDaysToExpiry(expiryDate: string): number {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = Math.abs(expiry.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Normal distribution approximation
   */
  private static normalDistribution(x: number): number {
    const t =
      1 /
      (1 +
        0.2316419 * Math.abs(x));
    const d =
      0.3989423 *
      Math.exp((-x * x) / 2);
    const prob =
      d *
      t *
      (0.319381530 +
        t *
        (-0.356563782 +
          t *
          (1.781477937 +
            t *
            (-1.821255978 +
              t * 1.330274429))));

    return x >= 0 ? 1 - prob : prob;
  }
}

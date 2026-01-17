/**
 * Zerodha Historical Data Service
 * Fetches and caches historical data from Zerodha
 */

import { ZerodhaClient } from './zerodha-client';

export interface HistoricalDataCache {
  symbol: string;
  instrumentToken: number;
  interval: string;
  data: any[];
  lastUpdated: Date;
  expiryTime: number; // Cache expiry in milliseconds
}

export class HistoricalDataService {
  private cache: Map<string, HistoricalDataCache> = new Map();
  private zerodhaClient: ZerodhaClient | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor(zerodhaClient?: ZerodhaClient) {
    if (zerodhaClient) {
      this.zerodhaClient = zerodhaClient;
    }
  }

  /**
   * Initialize with Zerodha client
   */
  setZerodhaClient(client: ZerodhaClient) {
    this.zerodhaClient = client;
  }

  /**
   * Get historical data with caching
   */
  async getHistoricalData(
    instrumentToken: number,
    symbol: string,
    interval: string = 'minute',
    daysBack: number = 1
  ): Promise<any[]> {
    if (!this.zerodhaClient) {
      throw new Error('Zerodha client not initialized');
    }

    // Check cache first
    const cacheKey = `${symbol}_${interval}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.lastUpdated.getTime() + cached.expiryTime) {
      console.log(`Using cached data for ${cacheKey}`);
      return cached.data;
    }

    try {
      // Fetch from Zerodha
      const fromDate = this.getDateBefore(daysBack);
      const toDate = new Date().toISOString();

      const data = await this.zerodhaClient.getHistoricalData(
        instrumentToken,
        interval,
        fromDate,
        toDate
      );

      // Cache the data
      this.cache.set(cacheKey, {
        symbol,
        instrumentToken,
        interval,
        data,
        lastUpdated: new Date(),
        expiryTime: this.cacheExpiry,
      });

      return data;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get multi-timeframe data for comprehensive analysis
   */
  async getMultiTimeframeData(
    instrumentToken: number,
    symbol: string
  ): Promise<{
    minute: any[];
    fiveMinute: any[];
    fifteenMinute: any[];
    hourly: any[];
    daily: any[];
  }> {
    try {
      const [minute, fiveMinute, fifteenMinute, hourly, daily] = await Promise.all([
        this.getHistoricalData(instrumentToken, symbol, 'minute', 1),
        this.getHistoricalData(instrumentToken, symbol, '5minute', 1),
        this.getHistoricalData(instrumentToken, symbol, '15minute', 1),
        this.getHistoricalData(instrumentToken, symbol, 'hour', 5),
        this.getHistoricalData(instrumentToken, symbol, 'day', 30),
      ]);

      return {
        minute,
        fiveMinute,
        fifteenMinute,
        hourly,
        daily,
      };
    } catch (error) {
      console.error(`Error fetching multi-timeframe data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get intraday data (all candles for today)
   */
  async getIntradayData(
    instrumentToken: number,
    symbol: string,
    interval: string = 'minute'
  ): Promise<any[]> {
    return this.getHistoricalData(instrumentToken, symbol, interval, 1);
  }

  /**
   * Get swing data (last 5 days)
   */
  async getSwingData(
    instrumentToken: number,
    symbol: string,
    interval: string = 'hour'
  ): Promise<any[]> {
    return this.getHistoricalData(instrumentToken, symbol, interval, 5);
  }

  /**
   * Get positional data (last 30 days)
   */
  async getPositionalData(
    instrumentToken: number,
    symbol: string
  ): Promise<any[]> {
    return this.getHistoricalData(instrumentToken, symbol, 'day', 30);
  }

  /**
   * Clear specific cache
   */
  clearCache(symbol?: string, interval?: string) {
    if (symbol && interval) {
      const key = `${symbol}_${interval}`;
      this.cache.delete(key);
      console.log(`Cleared cache for ${key}`);
    } else if (symbol) {
      // Clear all intervals for this symbol
      for (const key of this.cache.keys()) {
        if (key.startsWith(symbol)) {
          this.cache.delete(key);
        }
      }
      console.log(`Cleared all cache for ${symbol}`);
    } else {
      // Clear all cache
      this.cache.clear();
      console.log('Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCached: number;
    cachedSymbols: string[];
    cacheSize: number;
  } {
    const cachedSymbols = Array.from(new Set(
      Array.from(this.cache.values()).map((c) => c.symbol)
    ));

    let cacheSize = 0;
    for (const cached of this.cache.values()) {
      cacheSize += JSON.stringify(cached.data).length;
    }

    return {
      totalCached: this.cache.size,
      cachedSymbols,
      cacheSize,
    };
  }

  /**
   * Get date string days before today
   */
  private getDateBefore(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Analyze data quality
   */
  analyzeDataQuality(data: any[]): {
    totalCandles: number;
    missingData: boolean;
    dataGaps: number;
    priceRange: { min: number; max: number };
    volumeStats: { min: number; max: number; avg: number };
  } {
    const prices = data.map((c) => c.close);
    const volumes = data.map((c) => c.volume);

    return {
      totalCandles: data.length,
      missingData: data.some((c) => !c.close || !c.volume),
      dataGaps: this.detectDataGaps(data),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      volumeStats: {
        min: Math.min(...volumes),
        max: Math.max(...volumes),
        avg: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      },
    };
  }

  /**
   * Detect data gaps in candle data
   */
  private detectDataGaps(data: any[]): number {
    let gaps = 0;

    for (let i = 1; i < data.length; i++) {
      const currentTime = new Date(data[i].timestamp).getTime();
      const prevTime = new Date(data[i - 1].timestamp).getTime();

      // Assuming 1-minute candles, gaps should be 60000ms
      if (currentTime - prevTime > 61000) {
        gaps++;
      }
    }

    return gaps;
  }
}

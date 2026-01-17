import express, { Router, Request, Response } from 'express';
import { ZerodhaClient } from '../services/zerodha-client';
import { TradingEngineService, SignalDetectionService } from '../services/trading-engine';

const router = Router();

// Initialize services (would be instantiated with proper auth in production)
let zerodhaClient: ZerodhaClient | null = null;
let tradingEngine: TradingEngineService | null = null;

/**
 * Initialize Zerodha connection
 */
router.post('/zerodha/connect', async (req: Request, res: Response) => {
  try {
    const { apiKey, accessToken, userId } = req.body;

    if (!apiKey || !accessToken || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    zerodhaClient = new ZerodhaClient({ apiKey, accessToken, userId });
    tradingEngine = new TradingEngineService(zerodhaClient);

    // Test connection
    const profile = await zerodhaClient.getProfile();

    res.json({
      status: 'connected',
      user: profile.user_id,
      email: profile.email,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get market data for signal analysis
 */
router.get('/zerodha/data/:symbol', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { symbol } = req.params;
    const { interval = 'minute', from, to } = req.query;

    // Search for instrument
    const instruments = await zerodhaClient.searchInstruments(symbol);
    if (!instruments || instruments.length === 0) {
      return res.status(404).json({ error: 'Symbol not found' });
    }

    const instrument = instruments[0];
    const fromDate = from as string || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const toDate = to as string || new Date().toISOString();

    // Get historical data
    const candles = await zerodhaClient.getHistoricalData(
      instrument.instrument_token,
      interval as string,
      fromDate,
      toDate
    );

    // Get current quote
    const quote = await zerodhaClient.getQuote([instrument.instrument_token]);

    res.json({
      symbol,
      instrument,
      currentPrice: quote[instrument.instrument_token].last_price,
      candles: candles || [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate trading signals
 */
router.post('/signals/generate', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { symbol, strategy = 'MA_CROSSOVER', parameters = {} } = req.body;

    // Get market data
    const instruments = await zerodhaClient.searchInstruments(symbol);
    if (!instruments || instruments.length === 0) {
      return res.status(404).json({ error: 'Symbol not found' });
    }

    const instrument = instruments[0];
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    const toDate = new Date().toISOString();

    const candles = await zerodhaClient.getHistoricalData(
      instrument.instrument_token,
      'minute',
      fromDate,
      toDate
    );

    if (!candles || candles.length === 0) {
      return res.status(400).json({ error: 'No market data available' });
    }

    let signal = null;
    let confidence = 0;

    // Detect signals based on strategy
    switch (strategy) {
      case 'MA_CROSSOVER':
        signal = SignalDetectionService.detectMAcrossover(
          candles,
          parameters.shortMA || 9,
          parameters.longMA || 21
        );
        confidence = signal ? 75 : 0;
        break;

      case 'RSI':
        signal = SignalDetectionService.detectRSI(candles, parameters.period || 14);
        confidence = signal ? 65 : 0;
        break;

      case 'MACD':
        signal = SignalDetectionService.detectMACD(candles);
        confidence = signal ? 70 : 0;
        break;

      case 'BOLLINGER':
        signal = SignalDetectionService.detectBollingerBands(
          candles,
          parameters.period || 20,
          parameters.deviation || 2
        );
        confidence = signal ? 60 : 0;
        break;

      default:
        return res.status(400).json({ error: 'Unknown strategy' });
    }

    if (!signal) {
      return res.json({ signal: null, message: 'No signal detected' });
    }

    // Calculate entry, target, and stoploss
    const lastCandle = candles[candles.length - 1];
    const currentPrice = lastCandle.close;
    const atr = calculateATR(candles, 14);

    let entry = currentPrice;
    let target: number;
    let stoploss: number;

    if (signal === 'BUY') {
      entry = currentPrice;
      target = currentPrice + atr * 2; // 2x ATR as target
      stoploss = currentPrice - atr;
    } else {
      entry = currentPrice;
      target = currentPrice - atr * 2;
      stoploss = currentPrice + atr;
    }

    // Calculate position size based on risk
    const risk = Math.abs(entry - stoploss);
    const quantity = Math.floor(10000 / risk); // Risk 10000 per trade

    res.json({
      symbol,
      action: signal,
      entry,
      target,
      stoploss,
      quantity,
      confidence,
      reason: `${strategy} signal detected on ${symbol}`,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Execute automatic trade
 */
router.post('/trades/execute', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient || !tradingEngine) {
      return res.status(400).json({ error: 'Services not initialized' });
    }

    const signalData = req.body;
    const trade = await tradingEngine.executeSignal(signalData);

    if (!trade) {
      return res.status(400).json({ error: 'Failed to execute trade' });
    }

    res.json({
      status: 'success',
      trade,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active trades
 */
router.get('/trades/active', async (req: Request, res: Response) => {
  try {
    if (!tradingEngine) {
      return res.status(400).json({ error: 'Trading engine not initialized' });
    }

    const trades = tradingEngine.getActiveTrades();
    res.json({ trades });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Monitor trades
 */
router.post('/trades/monitor', async (req: Request, res: Response) => {
  try {
    if (!tradingEngine) {
      return res.status(400).json({ error: 'Trading engine not initialized' });
    }

    await tradingEngine.monitorTrades();
    const trades = tradingEngine.getActiveTrades();

    res.json({
      status: 'monitored',
      trades,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel a trade
 */
router.post('/trades/:tradeId/cancel', async (req: Request, res: Response) => {
  try {
    if (!tradingEngine) {
      return res.status(400).json({ error: 'Trading engine not initialized' });
    }

    const { tradeId } = req.params;
    const cancelled = await tradingEngine.cancelTrade(tradeId);

    res.json({
      status: cancelled ? 'success' : 'failed',
      tradeId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get positions
 */
router.get('/positions', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const positions = await zerodhaClient.getPositions();
    res.json({ positions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get holdings
 */
router.get('/holdings', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const holdings = await zerodhaClient.getHoldings();
    res.json({ holdings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const orders = await zerodhaClient.getOrders();
    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze symbol using Ultimate Strategy
 */
router.post('/ultimate-strategy/analyze', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { symbol, instrumentToken, quantity = 1 } = req.body;

    if (!symbol || !instrumentToken) {
      return res.status(400).json({ error: 'Missing symbol or instrumentToken' });
    }

    const { UltimateStrategy } = await import('../services/ultimate-strategy');
    const strategy = new UltimateStrategy(zerodhaClient);
    
    const signal = await strategy.analyzeSymbol(instrumentToken, symbol, quantity);

    res.json({
      status: 'success',
      signal,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Execute automatic trade based on Ultimate Strategy
 */
router.post('/automatic-trade/execute', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const {
      symbol,
      instrumentToken,
      quantity = 1,
      minConfidence = 80,
      maxRiskPerTrade = 2,
      maxOpenTrades = 5,
    } = req.body;

    if (!symbol || !instrumentToken) {
      return res.status(400).json({ error: 'Missing symbol or instrumentToken' });
    }

    const { AutomaticTradeExecutor } = await import('../services/automatic-trade-executor');
    
    const config = {
      symbol,
      instrumentToken,
      quantity,
      minConfidence,
      maxRiskPerTrade,
      maxOpenTrades,
    };

    const executor = new AutomaticTradeExecutor(zerodhaClient, config);
    const trade = await executor.executeTradeSignals();

    res.json({
      status: 'success',
      trade,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active trades
 */
router.get('/automatic-trade/active', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    // This is a simplified example - in production, you'd fetch from a database
    const { AutomaticTradeExecutor } = await import('../services/automatic-trade-executor');
    
    const config = {
      symbol: 'RELIANCE',
      instrumentToken: 738561,
      quantity: 1,
      minConfidence: 80,
      maxRiskPerTrade: 2,
      maxOpenTrades: 5,
    };

    const executor = new AutomaticTradeExecutor(zerodhaClient, config);
    const activeTrades = executor.getActiveTrades();

    res.json({
      status: 'success',
      trades: activeTrades,
      count: activeTrades.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get trading statistics
 */
router.get('/automatic-trade/statistics', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { AutomaticTradeExecutor } = await import('../services/automatic-trade-executor');
    
    const config = {
      symbol: 'RELIANCE',
      instrumentToken: 738561,
      quantity: 1,
      minConfidence: 80,
      maxRiskPerTrade: 2,
      maxOpenTrades: 5,
    };

    const executor = new AutomaticTradeExecutor(zerodhaClient, config);
    const statistics = executor.getStatistics();

    res.json({
      status: 'success',
      statistics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Close a trade manually
 */
router.post('/automatic-trade/close', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { tradeId } = req.body;

    if (!tradeId) {
      return res.status(400).json({ error: 'Missing tradeId' });
    }

    const { AutomaticTradeExecutor } = await import('../services/automatic-trade-executor');
    
    const config = {
      symbol: 'RELIANCE',
      instrumentToken: 738561,
      quantity: 1,
      minConfidence: 80,
      maxRiskPerTrade: 2,
      maxOpenTrades: 5,
    };

    const executor = new AutomaticTradeExecutor(zerodhaClient, config);
    const success = await executor.closeTrade(tradeId);

    res.json({
      status: 'success',
      closed: success,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get AI Market Analysis
 */
router.post('/market-analysis/ai', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { symbol, instrumentToken, interval = 'hour' } = req.body;

    if (!symbol || !instrumentToken) {
      return res.status(400).json({ error: 'Missing symbol or instrumentToken' });
    }

    const { HistoricalDataService } = await import('../services/historical-data');
    const { AIMarketAnalysisService } = await import('../services/ai-market-analysis');

    const histService = new HistoricalDataService(zerodhaClient);
    const candles = await histService.getHistoricalData(
      instrumentToken,
      symbol,
      interval,
      5
    );

    if (!candles || candles.length === 0) {
      return res.status(400).json({ error: 'No historical data available' });
    }

    const analysis = AIMarketAnalysisService.analyzeMarket(candles, symbol);

    res.json({
      status: 'success',
      analysis,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Multi-Timeframe Analysis
 */
router.get('/market-analysis/multi-timeframe/:symbol/:instrumentToken', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { symbol, instrumentToken } = req.params;
    const token = parseInt(instrumentToken);

    const { HistoricalDataService } = await import('../services/historical-data');
    const { AIMarketAnalysisService } = await import('../services/ai-market-analysis');

    const histService = new HistoricalDataService(zerodhaClient);
    const multiFrameData = await histService.getMultiTimeframeData(token, symbol);

    const analyses = {
      minute: AIMarketAnalysisService.analyzeMarket(multiFrameData.minute, symbol),
      fiveMinute: AIMarketAnalysisService.analyzeMarket(multiFrameData.fiveMinute, symbol),
      fifteenMinute: AIMarketAnalysisService.analyzeMarket(multiFrameData.fifteenMinute, symbol),
      hourly: AIMarketAnalysisService.analyzeMarket(multiFrameData.hourly, symbol),
      daily: AIMarketAnalysisService.analyzeMarket(multiFrameData.daily, symbol),
    };

    res.json({
      status: 'success',
      analyses,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Historical Data
 */
router.get('/historical-data/:symbol/:instrumentToken', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { symbol, instrumentToken } = req.params;
    const { interval = 'minute', days = 1 } = req.query;

    const { HistoricalDataService } = await import('../services/historical-data');

    const histService = new HistoricalDataService(zerodhaClient);
    const data = await histService.getHistoricalData(
      parseInt(instrumentToken),
      symbol,
      interval as string,
      parseInt(days as string)
    );

    const quality = histService.analyzeDataQuality(data);

    res.json({
      status: 'success',
      data,
      quality,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Options Chains
 */
router.get('/options/chains/:symbol', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const { symbol } = req.params;
    const { spot_price = 100, strike_interval = 100 } = req.query;

    const { OptionsTradeService } = await import('../services/options-trading');

    const strikes = OptionsTradeService.getAvailableStrikes(
      parseFloat(spot_price as string),
      parseInt(strike_interval as string)
    );

    const weeklyExpiry = OptionsTradeService.getNextExpiryDate('WEEKLY');
    const monthlyExpiry = OptionsTradeService.getNextExpiryDate('MONTHLY');

    res.json({
      status: 'success',
      symbol,
      spotPrice: spot_price,
      strikes,
      expiryDates: {
        weekly: weeklyExpiry,
        monthly: monthlyExpiry,
        weeklyDaysLeft: OptionsTradeService.getDaysToExpiry(weeklyExpiry),
        monthlyDaysLeft: OptionsTradeService.getDaysToExpiry(monthlyExpiry),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate Greeks for Options
 */
router.post('/options/greeks', async (req: Request, res: Response) => {
  try {
    const {
      spotPrice,
      strikePrice,
      daysToExpiry,
      volatility = 30,
      optionType = 'CE',
    } = req.body;

    if (!spotPrice || !strikePrice || !daysToExpiry) {
      return res
        .status(400)
        .json({ error: 'Missing spotPrice, strikePrice, or daysToExpiry' });
    }

    const { OptionsTradeService } = await import('../services/options-trading');

    const greeks = OptionsTradeService.calculateGreeks(
      parseFloat(spotPrice),
      parseFloat(strikePrice),
      parseInt(daysToExpiry),
      parseFloat(volatility),
      0.05,
      optionType
    );

    const price = OptionsTradeService.calculateOptionPrice(
      parseFloat(spotPrice),
      parseFloat(strikePrice),
      parseInt(daysToExpiry),
      parseFloat(volatility),
      0.05,
      0,
      optionType
    );

    res.json({
      status: 'success',
      greeks,
      theoreticalPrice: price,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Suggest Options Strategy
 */
router.post('/options/strategy/suggest', async (req: Request, res: Response) => {
  try {
    const { marketTrend, volatility = 30, basePrice = 100 } = req.body;

    if (!marketTrend) {
      return res.status(400).json({ error: 'Missing marketTrend' });
    }

    const { OptionsTradeService } = await import('../services/options-trading');

    const suggestions = OptionsTradeService.suggestStrategy(
      marketTrend,
      parseFloat(volatility),
      parseFloat(basePrice),
      []
    );

    res.json({
      status: 'success',
      marketTrend,
      volatility,
      suggestedStrategies: suggestions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Execute Options Trade (Multiple Legs)
 */
router.post('/options/trade/execute', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const {
      symbol,
      instrumentTokens,
      orders,
      strategyType = 'BULL_CALL_SPREAD',
      quantity = 1,
    } = req.body;

    // Execute multiple legs
    const executedOrders: any[] = [];

    for (const order of orders) {
      try {
        const result = await zerodhaClient.placeOrder(
          order.symbol,
          'NFO', // Options trading
          order.side,
          quantity,
          order.price,
          'LIMIT'
        );

        executedOrders.push({
          symbol: order.symbol,
          status: 'executed',
          orderId: result.order_id,
        });
      } catch (err) {
        executedOrders.push({
          symbol: order.symbol,
          status: 'failed',
          error: (err as any).message,
        });
      }
    }

    res.json({
      status: 'success',
      strategyType,
      executedOrders,
      summary: {
        total: executedOrders.length,
        successful: executedOrders.filter((o) => o.status === 'executed').length,
        failed: executedOrders.filter((o) => o.status === 'failed').length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get All Active Instruments for Portfolio
 */
router.get('/portfolio/instruments', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const holdings = await zerodhaClient.getHoldings();
    const positions = await zerodhaClient.getPositions();

    const instruments = {
      holdings: holdings || [],
      positions: positions || [],
      total: {
        holdingsCount: holdings?.length || 0,
        positionsCount: positions?.length || 0,
      },
    };

    res.json({
      status: 'success',
      instruments,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Account Balance & Margin
 */
router.get('/account/margins', async (req: Request, res: Response) => {
  try {
    if (!zerodhaClient) {
      return res.status(400).json({ error: 'Zerodha not connected' });
    }

    const margins = await zerodhaClient.getMargins();
    const profile = await zerodhaClient.getProfile();

    res.json({
      status: 'success',
      profile,
      margins,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Utility function
function calculateATR(candles: any[], period: number): number {
  const trs = candles.map((candle, i) => {
    if (i === 0) return candle.high - candle.low;
    const prevClose = candles[i - 1].close;
    const tr1 = candle.high - candle.low;
    const tr2 = Math.abs(candle.high - prevClose);
    const tr3 = Math.abs(candle.low - prevClose);
    return Math.max(tr1, tr2, tr3);
  });

  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export default router;

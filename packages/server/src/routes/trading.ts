import express, { Router, Request, Response } from 'express';
import { ZerodhaClient } from '../services/zerodha-client';
import { TradingEngineService, SignalDetectionService } from '../services/trading-engine';
import { TradingSignalSchema } from '@trading-app/shared';

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
    const atr = this.calculateATR(candles, 14);

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

    const signalData = TradingSignalSchema.parse(req.body);
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

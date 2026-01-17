import React, { useState, useEffect } from 'react';

interface TradeConfig {
  symbol: string;
  quantity: number;
  profitTarget: number;
  stopLoss: number;
  timeframe: string;
  instrumentType: 'EQUITY' | 'OPTION';
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
  expiryType?: 'WEEKLY' | 'MONTHLY';
}

interface AISignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  recommendation: string;
  entryPrice?: number;
  aiScore: number;
  technicalScore: number;
}

interface ActiveTrade {
  id: string;
  symbol: string;
  signal: string;
  entryPrice: number;
  quantity: number;
  target: number;
  stoploss: number;
  status: 'ACTIVE' | 'FILLED' | 'CANCELLED';
  pnl?: number;
  pnlPercent?: number;
  timestamp: string;
  type: 'EQUITY' | 'OPTION';
}

export default function AIAutoTrading() {
  const [configs, setConfigs] = useState<TradeConfig[]>([
    {
      symbol: 'RELIANCE',
      quantity: 1,
      profitTarget: 2,
      stopLoss: 1,
      timeframe: '15m',
      instrumentType: 'EQUITY',
    },
  ]);

  const [signals, setSignals] = useState<AISignal[]>([]);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Add new trade config
  const addTradeConfig = () => {
    setConfigs([
      ...configs,
      {
        symbol: 'TCS',
        quantity: 1,
        profitTarget: 2,
        stopLoss: 1,
        timeframe: '15m',
        instrumentType: 'EQUITY',
      },
    ]);
  };

  // Remove trade config
  const removeTradeConfig = (index: number) => {
    setConfigs(configs.filter((_, i) => i !== index));
  };

  // Update trade config
  const updateTradeConfig = (index: number, field: string, value: any) => {
    const updated = [...configs];
    (updated[index] as any)[field] = value;
    setConfigs(updated);
  };

  // Generate AI signals
  const generateSignals = async () => {
    setLoading(true);
    try {
      const allSignals: AISignal[] = [];

      for (const config of configs) {
        try {
          const response = await fetch(
            `${API_URL}/api/trading/ultimate-strategy/analyze`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbol: config.symbol }),
            }
          );

          const data = await response.json();
          if (data.signal) {
            allSignals.push({
              symbol: config.symbol,
              signal: data.signal.signal,
              confidence: data.signal.confidence,
              recommendation: data.signal.recommendation,
              entryPrice: data.signal.entryPrice,
              aiScore: 85, // Would come from AI analysis
              technicalScore: 82,
            });
          }
        } catch (error) {
          console.error(`Error getting signal for ${config.symbol}:`, error);
        }
      }

      setSignals(allSignals);
    } finally {
      setLoading(false);
    }
  };

  // Execute auto trades based on signals
  const executeAutoTrades = async () => {
    setLoading(true);
    try {
      const newTrades: ActiveTrade[] = [];

      for (const signal of signals) {
        if (signal.signal !== 'NEUTRAL' && signal.confidence > 70) {
          const config = configs.find((c) => c.symbol === signal.symbol);
          if (!config) continue;

          // Calculate SL and Target based on percentage
          const entryPrice = signal.entryPrice || 100;
          const stopLoss = signal.signal === 'BUY' 
            ? entryPrice * (1 - config.stopLoss / 100)
            : entryPrice * (1 + config.stopLoss / 100);
          
          const target = signal.signal === 'BUY'
            ? entryPrice * (1 + config.profitTarget / 100)
            : entryPrice * (1 - config.profitTarget / 100);

          const trade: ActiveTrade = {
            id: `${signal.symbol}-${Date.now()}`,
            symbol: signal.symbol,
            signal: signal.signal,
            entryPrice,
            quantity: config.quantity,
            target,
            stoploss: stopLoss,
            status: 'ACTIVE',
            timestamp: new Date().toISOString(),
            type: config.instrumentType,
          };

          newTrades.push(trade);
        }
      }

      setActiveTrades([...activeTrades, ...newTrades]);

      // Execute trades via API
      if (newTrades.length > 0) {
        for (const trade of newTrades) {
          try {
            await fetch(`${API_URL}/api/trading/automatic-trade/execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                symbol: trade.symbol,
                quantity: trade.quantity,
                side: trade.signal,
                target: trade.target,
                stoploss: trade.stoploss,
              }),
            });
          } catch (error) {
            console.error(`Error executing trade for ${trade.symbol}:`, error);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Start auto trading loop
  useEffect(() => {
    if (!autoTradingEnabled) return;

    const interval = setInterval(() => {
      generateSignals();
    }, 60000); // Update signals every minute

    return () => clearInterval(interval);
  }, [autoTradingEnabled, configs]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'SELL':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return '🟢';
      case 'SELL':
        return '🔴';
      default:
        return '🟡';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">🤖 AI Auto Trading</h1>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">⚙️ Trading Configuration</h2>
            <button
              onClick={() => setAutoTradingEnabled(!autoTradingEnabled)}
              className={`px-6 py-2 rounded-lg font-medium text-white ${
                autoTradingEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {autoTradingEnabled ? '⏹️ Stop Auto Trading' : '▶️ Start Auto Trading'}
            </button>
          </div>

          {autoTradingEnabled && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✅ Auto Trading is ACTIVE - Monitoring signals every minute</p>
            </div>
          )}

          {/* Trade Configs */}
          <div className="space-y-4">
            {configs.map((config, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Symbol</label>
                  <input
                    type="text"
                    value={config.symbol}
                    onChange={(e) => updateTradeConfig(idx, 'symbol', e.target.value.toUpperCase())}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qty/Lot</label>
                  <input
                    type="number"
                    value={config.quantity}
                    onChange={(e) => updateTradeConfig(idx, 'quantity', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target %</label>
                  <input
                    type="number"
                    value={config.profitTarget}
                    onChange={(e) => updateTradeConfig(idx, 'profitTarget', parseFloat(e.target.value))}
                    step="0.1"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SL %</label>
                  <input
                    type="number"
                    value={config.stopLoss}
                    onChange={(e) => updateTradeConfig(idx, 'stopLoss', parseFloat(e.target.value))}
                    step="0.1"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Timeframe</label>
                  <select
                    value={config.timeframe}
                    onChange={(e) => updateTradeConfig(idx, 'timeframe', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="5m">5min</option>
                    <option value="15m">15min</option>
                    <option value="1h">1hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select
                    value={config.instrumentType}
                    onChange={(e) => updateTradeConfig(idx, 'instrumentType', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="EQUITY">Equity</option>
                    <option value="OPTION">Option</option>
                  </select>
                </div>

                <button
                  onClick={() => removeTradeConfig(idx)}
                  className="self-end px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addTradeConfig}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Symbol
          </button>
        </div>

        {/* Signal Generation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={generateSignals}
            disabled={loading}
            className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium text-lg"
          >
            {loading ? '⏳ Generating...' : '🎯 Generate Signals'}
          </button>

          <button
            onClick={executeAutoTrades}
            disabled={loading || signals.length === 0}
            className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium text-lg"
          >
            {loading ? '⏳ Executing...' : '🚀 Execute Trades'}
          </button>
        </div>

        {/* AI Signals Display */}
        {signals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 AI Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {signals.map((signal) => (
                <div
                  key={signal.symbol}
                  className={`p-6 rounded-lg border-2 ${getSignalColor(signal.signal)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-2xl font-bold">{signal.symbol}</p>
                      <p className="text-sm opacity-75">{signal.recommendation}</p>
                    </div>
                    <p className="text-3xl">{getSignalIcon(signal.signal)}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Signal:</span>
                      <span className="font-bold">{signal.signal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-bold">{signal.confidence.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Score:</span>
                      <span className="font-bold text-blue-600">{signal.aiScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Technical:</span>
                      <span className="font-bold text-green-600">{signal.technicalScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Trades */}
        {activeTrades.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Active Trades</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Symbol</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Signal</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Entry</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Qty</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Target</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">SL</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrades.map((trade) => (
                    <tr key={trade.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold">{trade.symbol}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            trade.signal === 'BUY'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trade.signal}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">₹{trade.entryPrice.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right">{trade.quantity}</td>
                      <td className="px-6 py-3 text-right font-medium text-green-600">
                        ₹{trade.target.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-red-600">
                        ₹{trade.stoploss.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

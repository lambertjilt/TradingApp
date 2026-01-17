import React, { useState } from 'react';

interface OptionsTradeConfig {
  symbol: string;
  strikePrice: number;
  optionType: 'CE' | 'PE';
  expiryType: 'WEEKLY' | 'MONTHLY';
  quantity: number;
  entryPrice: number;
  profitTarget: number;
  stopLoss: number;
}

interface OptionsSignal {
  symbol: string;
  strikePrice: number;
  optionType: 'CE' | 'PE';
  signal: 'BUY' | 'SELL';
  confidence: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  strategy: string;
}

interface ActiveOptionsPosition {
  id: string;
  symbol: string;
  strikePrice: number;
  optionType: 'CE' | 'PE';
  signal: string;
  entryPrice: number;
  quantity: number;
  target: number;
  stoploss: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  greeks?: any;
  status: 'OPEN' | 'CLOSED';
  timestamp: string;
}

export default function OptionsAutoTrading() {
  const [configs, setConfigs] = useState<OptionsTradeConfig[]>([
    {
      symbol: 'RELIANCE',
      strikePrice: 2800,
      optionType: 'CE',
      expiryType: 'WEEKLY',
      quantity: 1,
      entryPrice: 50,
      profitTarget: 20,
      stopLoss: 10,
    },
  ]);

  const [signals, setSignals] = useState<OptionsSignal[]>([]);
  const [positions, setPositions] = useState<ActiveOptionsPosition[]>([]);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Add new options config
  const addOptionsConfig = () => {
    setConfigs([
      ...configs,
      {
        symbol: 'TCS',
        strikePrice: 3500,
        optionType: 'PE',
        expiryType: 'MONTHLY',
        quantity: 1,
        entryPrice: 60,
        profitTarget: 25,
        stopLoss: 15,
      },
    ]);
  };

  // Remove config
  const removeConfig = (index: number) => {
    setConfigs(configs.filter((_, i) => i !== index));
  };

  // Update config
  const updateConfig = (index: number, field: string, value: any) => {
    const updated = [...configs];
    (updated[index] as any)[field] = value;
    setConfigs(updated);
  };

  // Generate options signals
  const generateSignals = async () => {
    setLoading(true);
    try {
      const newSignals: OptionsSignal[] = [];

      for (const config of configs) {
        try {
          // Get Greeks
          const greeksResponse = await fetch(
            `${API_URL}/api/trading/options/greeks`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                spotPrice: 2750,
                strikePrice: config.strikePrice,
                daysToExpiry: 7,
                volatility: 30,
                optionType: config.optionType,
              }),
            }
          );

          const greeksData = await greeksResponse.json();

          // Get strategy suggestions
          const strategyResponse = await fetch(
            `${API_URL}/api/trading/options/strategy/suggest`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                marketTrend: 'BUY',
                volatility: 30,
                basePrice: 2750,
              }),
            }
          );

          const strategyData = await strategyResponse.json();

          newSignals.push({
            symbol: config.symbol,
            strikePrice: config.strikePrice,
            optionType: config.optionType,
            signal: config.optionType === 'CE' ? 'BUY' : 'SELL',
            confidence: 78,
            greeks: greeksData.greeks || {},
            strategy: strategyData.suggestedStrategies?.[0] || 'Bull Call',
          });
        } catch (error) {
          console.error(`Error getting signal for ${config.symbol}:`, error);
        }
      }

      setSignals(newSignals);
    } finally {
      setLoading(false);
    }
  };

  // Execute options trades
  const executeOptionsTrades = async () => {
    setLoading(true);
    try {
      const newPositions: ActiveOptionsPosition[] = [];

      for (const signal of signals) {
        const config = configs.find((c) => c.symbol === signal.symbol);
        if (!config) continue;

        const position: ActiveOptionsPosition = {
          id: `${signal.symbol}-${signal.strikePrice}-${Date.now()}`,
          symbol: signal.symbol,
          strikePrice: signal.strikePrice,
          optionType: signal.optionType,
          signal: signal.signal,
          entryPrice: config.entryPrice,
          quantity: config.quantity,
          target: config.entryPrice + config.profitTarget,
          stoploss: config.entryPrice - config.stopLoss,
          greeks: signal.greeks,
          status: 'OPEN',
          timestamp: new Date().toISOString(),
        };

        newPositions.push(position);
      }

      setPositions([...positions, ...newPositions]);
    } finally {
      setLoading(false);
    }
  };

  const getSignalBadgeColor = (signal: string) => {
    return signal === 'BUY'
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">📊 Options Auto Trading</h1>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">⚙️ Options Configuration</h2>
            <button
              onClick={() => setAutoTradingEnabled(!autoTradingEnabled)}
              className={`px-6 py-2 rounded-lg font-medium text-white ${
                autoTradingEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {autoTradingEnabled ? '⏹️ Stop' : '▶️ Start'}
            </button>
          </div>

          {autoTradingEnabled && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✅ Options Auto Trading is ACTIVE</p>
            </div>
          )}

          {/* Options Configs */}
          <div className="space-y-4">
            {configs.map((config, idx) => (
              <div key={idx} className="grid grid-cols-2 md:grid-cols-8 gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Symbol</label>
                  <input
                    type="text"
                    value={config.symbol}
                    onChange={(e) => updateConfig(idx, 'symbol', e.target.value.toUpperCase())}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Strike</label>
                  <input
                    type="number"
                    value={config.strikePrice}
                    onChange={(e) => updateConfig(idx, 'strikePrice', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select
                    value={config.optionType}
                    onChange={(e) => updateConfig(idx, 'optionType', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="CE">Call (CE)</option>
                    <option value="PE">Put (PE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expiry</label>
                  <select
                    value={config.expiryType}
                    onChange={(e) => updateConfig(idx, 'expiryType', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                  <input
                    type="number"
                    value={config.quantity}
                    onChange={(e) => updateConfig(idx, 'quantity', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Entry</label>
                  <input
                    type="number"
                    value={config.entryPrice}
                    onChange={(e) => updateConfig(idx, 'entryPrice', parseFloat(e.target.value))}
                    step="0.5"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target</label>
                  <input
                    type="number"
                    value={config.profitTarget}
                    onChange={(e) => updateConfig(idx, 'profitTarget', parseFloat(e.target.value))}
                    step="0.5"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">SL</label>
                    <input
                      type="number"
                      value={config.stopLoss}
                      onChange={(e) => updateConfig(idx, 'stopLoss', parseFloat(e.target.value))}
                      step="0.5"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeConfig(idx)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addOptionsConfig}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Options
          </button>
        </div>

        {/* Generate & Execute */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={generateSignals}
            disabled={loading}
            className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium text-lg"
          >
            {loading ? '⏳ Analyzing...' : '🔍 Analyze Signals'}
          </button>

          <button
            onClick={executeOptionsTrades}
            disabled={loading || signals.length === 0}
            className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium text-lg"
          >
            {loading ? '⏳ Executing...' : '🚀 Execute Trades'}
          </button>
        </div>

        {/* Signals with Greeks */}
        {signals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Options Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signals.map((signal) => (
                <div key={`${signal.symbol}-${signal.strikePrice}`} className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xl font-bold text-gray-900">{signal.symbol}</p>
                      <p className="text-sm text-gray-600">
                        {signal.strikePrice} {signal.optionType}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getSignalBadgeColor(
                        signal.signal
                      )}`}
                    >
                      {signal.signal}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700">{signal.strategy}</p>
                    <p className="text-xs text-gray-600 mt-1">Confidence: {signal.confidence}%</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded">
                    <div>
                      <p className="text-gray-600">Delta</p>
                      <p className="font-bold text-gray-900">{signal.greeks.delta?.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Gamma</p>
                      <p className="font-bold text-gray-900">{signal.greeks.gamma?.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Theta</p>
                      <p className="font-bold text-gray-900">{signal.greeks.theta?.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Vega</p>
                      <p className="font-bold text-gray-900">{signal.greeks.vega?.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Positions */}
        {positions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Active Positions</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Symbol</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Strike</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Entry</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Qty</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Target</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">SL</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold">{pos.symbol}</td>
                      <td className="px-6 py-3">{pos.strikePrice}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            pos.optionType === 'CE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pos.optionType}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">₹{pos.entryPrice.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right">{pos.quantity}</td>
                      <td className="px-6 py-3 text-right font-medium text-green-600">
                        ₹{pos.target.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-red-600">
                        ₹{pos.stoploss.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {pos.status}
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

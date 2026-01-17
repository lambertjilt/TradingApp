import React, { useState, useEffect } from 'react';

interface Signal {
  symbol: string;
  action: 'BUY' | 'SELL';
  entry: number;
  target: number;
  stoploss: number;
  quantity: number;
  confidence: number;
  reason: string;
}

export default function TradingSignals() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [strategy, setStrategy] = useState('MA_CROSSOVER');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoTrade, setAutoTrade] = useState(false);

  const generateSignal = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/trading/signals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, strategy }),
      });

      const data = await response.json();
      if (data.signal) {
        setSignals([data, ...signals.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Error generating signal:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeSignal = async (signal: Signal) => {
    try {
      const response = await fetch('http://localhost:5000/api/trading/trades/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signal),
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('Trade executed successfully!');
      }
    } catch (error) {
      console.error('Error executing trade:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Automated Trading Signals</h1>

      {/* Signal Generator */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate Trading Signal</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., RELIANCE"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="MA_CROSSOVER">Moving Average Crossover</option>
              <option value="RSI">RSI (Relative Strength Index)</option>
              <option value="MACD">MACD</option>
              <option value="BOLLINGER">Bollinger Bands</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
            <button
              onClick={generateSignal}
              disabled={loading}
              className="mt-1 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Generate Signal'}
            </button>
          </div>
        </div>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={autoTrade}
            onChange={(e) => setAutoTrade(e.target.checked)}
            className="rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Auto-execute trades</span>
        </label>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Signals</h2>
        
        {signals.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            No signals generated yet
          </div>
        ) : (
          signals.map((signal, idx) => (
            <div key={idx} className={`rounded-lg shadow p-6 border-l-4 ${
              signal.action === 'BUY' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="font-semibold">{signal.symbol}</h3>
                  <p className="text-2xl font-bold" style={{
                    color: signal.action === 'BUY' ? '#16a34a' : '#dc2626'
                  }}>
                    {signal.action}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Entry • Target • SL</p>
                  <p className="font-semibold">
                    ₹{signal.entry.toFixed(2)} • ₹{signal.target.toFixed(2)} • ₹{signal.stoploss.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Qty: {signal.quantity} | Confidence: {signal.confidence}%
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Risk/Reward</p>
                  <p className="font-semibold">
                    {(Math.abs(signal.target - signal.entry) / Math.abs(signal.entry - signal.stoploss)).toFixed(2)}x
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{signal.reason}</p>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => executeSignal(signal)}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      signal.action === 'BUY'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Execute
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

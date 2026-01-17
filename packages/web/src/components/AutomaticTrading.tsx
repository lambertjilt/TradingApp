import React, { useState, useEffect } from 'react';

interface TradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | null;
  confidence: number;
  signals_matched: string[];
  price: number;
  target: number;
  stoploss: number;
  risk_reward_ratio: number;
}

interface ExecutedTrade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  quantity: number;
  target: number;
  stoploss: number;
  status: string;
  confidence: number;
  pnl?: number;
}

interface Statistics {
  activeTradesCount: number;
  closedTradesCount: number;
  profitableTradesCount: number;
  winRate: string;
  totalPnL: string;
  avgConfidence: string;
}

export default function AutomaticTrading() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [instrumentToken, setInstrumentToken] = useState('738561');
  const [quantity, setQuantity] = useState('1');
  const [minConfidence, setMinConfidence] = useState('80');
  const [maxOpenTrades, setMaxOpenTrades] = useState('5');

  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [activeTrades, setActiveTrades] = useState<ExecutedTrade[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoTradeActive, setAutoTradeActive] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  /**
   * Analyze symbol using Ultimate Strategy
   */
  const handleAnalyzeSignal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trading/ultimate-strategy/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          instrumentToken: parseInt(instrumentToken),
          quantity: parseInt(quantity),
        }),
      });

      const data = await response.json();
      if (data.signal) {
        setCurrentSignal(data.signal);
      }
    } catch (error) {
      console.error('Error analyzing signal:', error);
      alert('Error analyzing signal');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute automatic trade
   */
  const handleExecuteTrade = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trading/automatic-trade/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          instrumentToken: parseInt(instrumentToken),
          quantity: parseInt(quantity),
          minConfidence: parseInt(minConfidence),
          maxOpenTrades: parseInt(maxOpenTrades),
        }),
      });

      const data = await response.json();
      if (data.trade) {
        alert(`Trade executed! Entry: ₹${data.trade.entryPrice}`);
        await handleRefreshStats();
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      alert('Error executing trade');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh active trades and statistics
   */
  const handleRefreshStats = async () => {
    try {
      const tradesResponse = await fetch(`${API_URL}/api/trading/automatic-trade/active`);
      const tradesData = await tradesResponse.json();
      setActiveTrades(tradesData.trades || []);

      const statsResponse = await fetch(`${API_URL}/api/trading/automatic-trade/statistics`);
      const statsData = await statsResponse.json();
      setStatistics(statsData.statistics);
    } catch (error) {
      console.error('Error refreshing statistics:', error);
    }
  };

  /**
   * Start auto trading loop
   */
  const handleStartAutoTrade = () => {
    setAutoTradeActive(true);
    // Auto-execute trades every 5 minutes
    const interval = setInterval(() => {
      handleExecuteTrade();
    }, 5 * 60 * 1000);

    setTimeout(() => {
      clearInterval(interval);
      setAutoTradeActive(false);
    }, 60 * 60 * 1000); // Stop after 1 hour
  };

  /**
   * Close a trade
   */
  const handleCloseTrade = async (tradeId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trading/automatic-trade/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId }),
      });

      const data = await response.json();
      if (data.closed) {
        alert('Trade closed successfully');
        await handleRefreshStats();
      }
    } catch (error) {
      console.error('Error closing trade:', error);
      alert('Error closing trade');
    } finally {
      setLoading(false);
    }
  };

  // Refresh stats on component mount
  useEffect(() => {
    handleRefreshStats();
    const interval = setInterval(handleRefreshStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Automatic Trading with Ultimate Strategy</h1>

        {/* Trading Configuration */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trading Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., RELIANCE"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrument Token</label>
              <input
                type="text"
                value={instrumentToken}
                onChange={(e) => setInstrumentToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 738561"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Confidence %</label>
              <input
                type="number"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Open Trades</label>
              <input
                type="number"
                value={maxOpenTrades}
                onChange={(e) => setMaxOpenTrades(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleAnalyzeSignal}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Analyzing...' : 'Analyze Signal'}
            </button>

            <button
              onClick={handleExecuteTrade}
              disabled={loading || !currentSignal?.signal}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Executing...' : 'Execute Trade'}
            </button>

            <button
              onClick={handleStartAutoTrade}
              disabled={loading || autoTradeActive}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              {autoTradeActive ? 'Auto Trading Active' : 'Start Auto Trading'}
            </button>

            <button
              onClick={handleRefreshStats}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Current Signal Display */}
        {currentSignal && (
          <div
            className={`rounded-lg shadow-lg p-6 mb-8 ${
              currentSignal.signal === 'BUY'
                ? 'bg-green-50 border-2 border-green-500'
                : currentSignal.signal === 'SELL'
                ? 'bg-red-50 border-2 border-red-500'
                : 'bg-gray-50 border-2 border-gray-300'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Signal</p>
                <p
                  className={`text-2xl font-bold ${
                    currentSignal.signal === 'BUY'
                      ? 'text-green-600'
                      : currentSignal.signal === 'SELL'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {currentSignal.signal || 'NO SIGNAL'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentSignal.confidence.toFixed(2)}%
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{currentSignal.price.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Target</p>
                <p className="text-lg font-bold text-green-600">₹{currentSignal.target.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Stoploss</p>
                <p className="text-lg font-bold text-red-600">₹{currentSignal.stoploss.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Risk/Reward</p>
                <p className="text-lg font-bold text-purple-600">{currentSignal.risk_reward_ratio.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Signals Matched ({currentSignal.signals_matched.length}):</p>
              <div className="flex flex-wrap gap-2">
                {currentSignal.signals_matched.map((sig, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active Trades</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.activeTradesCount}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Closed Trades</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.closedTradesCount}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Profitable</p>
              <p className="text-3xl font-bold text-green-600">{statistics.profitableTradesCount}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Win Rate</p>
              <p className="text-3xl font-bold text-purple-600">{statistics.winRate}%</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total P&L</p>
              <p className={`text-3xl font-bold ${parseFloat(statistics.totalPnL) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{statistics.totalPnL}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.avgConfidence}%</p>
            </div>
          </div>
        )}

        {/* Active Trades Table */}
        {activeTrades.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Active Trades</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Entry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">SL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{trade.symbol}</td>
                      <td className={`px-6 py-4 text-sm font-bold ${trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{trade.entryPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-green-600">₹{trade.target.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-red-600">₹{trade.stoploss.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-medium">{trade.confidence.toFixed(2)}%</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.status === 'EXECUTED'
                              ? 'bg-blue-100 text-blue-800'
                              : trade.status === 'CLOSED'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleCloseTrade(trade.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-xs"
                        >
                          Close
                        </button>
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

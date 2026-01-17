import React, { useState, useEffect } from 'react';

interface EquityPosition {
  symbol: string;
  quantity: number;
  avgCost: number;
  ltp: number;
  pl: number;
  plPercent: number;
  multiplier: number;
}

interface EquitySignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  stopLoss: number;
  target: number;
  recommendation: string;
}

export default function MultiEquityTrading() {
  const [equities, setEquities] = useState<string[]>(['RELIANCE', 'TCS', 'INFY', 'HDFC', 'BAJAJFINSV']);
  const [newEquity, setNewEquity] = useState('');
  const [positions, setPositions] = useState<EquityPosition[]>([]);
  const [signals, setSignals] = useState<EquitySignal[]>([]);
  const [portfolioStats, setPortfolioStats] = useState({
    totalInvestment: 0,
    totalPL: 0,
    totalPLPercent: 0,
    winCount: 0,
    lossCount: 0,
    totalPositions: 0,
  });

  const [loading, setLoading] = useState(false);
  const [selectedEquity, setSelectedEquity] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Add new equity to watchlist
  const addEquity = () => {
    if (newEquity && !equities.includes(newEquity.toUpperCase())) {
      setEquities([...equities, newEquity.toUpperCase()]);
      setNewEquity('');
    }
  };

  // Remove equity from watchlist
  const removeEquity = (symbol: string) => {
    setEquities(equities.filter((e) => e !== symbol));
  };

  // Fetch all holdings
  const fetchHoldings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trading/portfolio/instruments`);
      const data = await response.json();

      if (data.holdings) {
        const processedHoldings = data.holdings.map((h: any) => ({
          symbol: h.tradingsymbol,
          quantity: h.quantity,
          avgCost: h.average_price,
          ltp: h.last_price,
          pl: (h.last_price - h.average_price) * h.quantity,
          plPercent: ((h.last_price - h.average_price) / h.average_price) * 100,
          multiplier: 1,
        }));

        setPositions(processedHoldings);

        // Calculate portfolio stats
        const stats = {
          totalInvestment: processedHoldings.reduce(
            (sum: number, h: any) => sum + h.avgCost * h.quantity,
            0
          ),
          totalPL: processedHoldings.reduce((sum: number, h: any) => sum + h.pl, 0),
          totalPLPercent:
            (processedHoldings.reduce((sum: number, h: any) => sum + h.pl, 0) /
              processedHoldings.reduce(
                (sum: number, h: any) => sum + h.avgCost * h.quantity,
                0
              )) *
            100,
          winCount: processedHoldings.filter((h: any) => h.pl > 0).length,
          lossCount: processedHoldings.filter((h: any) => h.pl < 0).length,
          totalPositions: processedHoldings.length,
        };

        setPortfolioStats(stats);
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate signals for all equities
  const generateSignals = async () => {
    setLoading(true);
    try {
      const signalPromises = equities.map(async (symbol) => {
        const response = await fetch(
          `${API_URL}/api/trading/ultimate-strategy/analyze`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol }),
          }
        );

        const data = await response.json();
        return {
          symbol,
          signal: data.signal?.signal || 'NEUTRAL',
          confidence: data.signal?.confidence || 0,
          stopLoss: data.signal?.stopLoss || 0,
          target: data.signal?.target || 0,
          recommendation: data.signal?.recommendation || 'No recommendation',
        };
      });

      const allSignals = await Promise.all(signalPromises);
      setSignals(allSignals);
    } catch (error) {
      console.error('Error generating signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return '🟢';
      case 'SELL':
        return '🔴';
      case 'NEUTRAL':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-50 border-green-200';
      case 'SELL':
        return 'bg-red-50 border-red-200';
      case 'NEUTRAL':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">📈 Multi-Equity Trading</h1>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-gray-600 text-sm">Total Investment</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{(portfolioStats.totalInvestment / 100000).toFixed(1)}L
            </p>
          </div>

          <div
            className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${
              portfolioStats.totalPL >= 0 ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <p className="text-gray-600 text-sm">Total P&L</p>
            <p
              className={`text-3xl font-bold ${
                portfolioStats.totalPL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ₹{portfolioStats.totalPL.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {portfolioStats.totalPLPercent.toFixed(2)}%
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-gray-600 text-sm">Positions</p>
            <p className="text-3xl font-bold text-gray-900">
              {portfolioStats.totalPositions}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                📈 {portfolioStats.winCount}
              </span>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                📉 {portfolioStats.lossCount}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-gray-600 text-sm">Win Rate</p>
            <p className="text-3xl font-bold text-blue-600">
              {portfolioStats.totalPositions > 0
                ? ((portfolioStats.winCount / portfolioStats.totalPositions) * 100).toFixed(0)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Equity to Watchlist
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newEquity}
                onChange={(e) => setNewEquity(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addEquity()}
                placeholder="e.g., SBIN"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={addEquity}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          <button
            onClick={fetchHoldings}
            disabled={loading}
            className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? '⏳ Loading Holdings...' : '📊 Fetch Holdings'}
          </button>

          <button
            onClick={generateSignals}
            disabled={loading}
            className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? '⏳ Generating Signals...' : '🎯 Generate Signals'}
          </button>
        </div>

        {/* Watchlist Equities */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Watchlist</h2>
          <div className="flex flex-wrap gap-2">
            {equities.map((equity) => (
              <button
                key={equity}
                onClick={() => setSelectedEquity(selectedEquity === equity ? null : equity)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedEquity === equity
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {equity}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEquity(equity);
                  }}
                  className="ml-2 text-xs"
                >
                  ✕
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* Trading Signals */}
        {signals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Trading Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signals.map((signal) => (
                <div
                  key={signal.symbol}
                  className={`p-6 rounded-lg border-l-4 ${getSignalColor(signal.signal)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{signal.symbol}</p>
                      <p className="text-sm text-gray-600">{signal.recommendation}</p>
                    </div>
                    <p className="text-2xl">{getSignalIcon(signal.signal)}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Signal</p>
                      <p className="font-bold text-gray-900">{signal.signal}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Confidence</p>
                      <p className="font-bold text-gray-900">{signal.confidence.toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Risk-Reward</p>
                      <p className="font-bold text-gray-900">
                        1:{((signal.target - signal.stopLoss) / (signal.target - signal.stopLoss)).toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-red-100 text-red-800 p-2 rounded">
                      <p>SL: ₹{signal.stopLoss.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-100 text-green-800 p-2 rounded">
                      <p>Target: ₹{signal.target.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Holdings */}
        {positions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💼 Current Holdings</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Avg Cost
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      LTP
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.symbol} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-gray-900">{pos.symbol}</td>
                      <td className="px-6 py-3 text-gray-700">{pos.quantity}</td>
                      <td className="px-6 py-3 text-right text-gray-700">
                        ₹{pos.avgCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700">
                        ₹{pos.ltp.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-semibold ${
                          pos.pl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ₹{pos.pl.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-semibold ${
                          pos.plPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {pos.plPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {positions.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No holdings found. Click "Fetch Holdings" to load your portfolio.</p>
          </div>
        )}
      </div>
    </div>
  );
}

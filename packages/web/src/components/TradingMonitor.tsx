import React, { useState, useEffect } from 'react';

interface MonitoredTrade {
  id: string;
  symbol: string;
  type: 'EQUITY' | 'OPTION';
  side: 'BUY' | 'SELL';
  entryPrice: number;
  quantity: number;
  target: number;
  stoploss: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  signal: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  confidence: number;
  timeframe: string;
  status: 'ACTIVE' | 'CLOSED' | 'PENDING';
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
  entryTime: string;
}

export default function TradingMonitor() {
  const [trades, setTrades] = useState<MonitoredTrade[]>([
    {
      id: '1',
      symbol: 'RELIANCE',
      type: 'EQUITY',
      side: 'BUY',
      entryPrice: 2750,
      quantity: 1,
      target: 2820,
      stoploss: 2710,
      currentPrice: 2785,
      pnl: 35,
      pnlPercent: 1.27,
      signal: 'STRONG_BUY',
      confidence: 85,
      timeframe: '15m',
      status: 'ACTIVE',
      entryTime: new Date().toISOString(),
    },
  ]);

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [sortBy, setSortBy] = useState<'pnl' | 'confidence' | 'symbol'>('pnl');

  // Calculate totals
  const activeTrades = trades.filter((t) => t.status === 'ACTIVE');
  const totalPNL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = trades.filter((t) => t.pnl > 0).length;
  const lossCount = trades.filter((t) => t.pnl < 0).length;
  const winRate =
    trades.length > 0 ? ((winCount / trades.length) * 100).toFixed(0) : '0';

  // Filter trades
  const filteredTrades = trades
    .filter((t) => {
      if (filter === 'ALL') return true;
      return t.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'pnl') return b.pnl - a.pnl;
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol);
      return 0;
    });

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-green-100 text-green-900 border-green-300';
      case 'BUY':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'STRONG_SELL':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'SELL':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const closeTrade = (id: string) => {
    setTrades(
      trades.map((t) =>
        t.id === id ? { ...t, status: 'CLOSED' } : t
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">📊 Trading Monitor</h1>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-gray-600 text-sm">Active Trades</p>
            <p className="text-3xl font-bold text-gray-900">{activeTrades.length}</p>
          </div>

          <div
            className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${
              totalPNL >= 0 ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <p className="text-gray-600 text-sm">Total P&L</p>
            <p
              className={`text-3xl font-bold ${
                totalPNL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ₹{totalPNL.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-gray-600 text-sm">Win Rate</p>
            <p className="text-3xl font-bold text-blue-600">{winRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {winCount}W / {lossCount}L
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-gray-600 text-sm">Total Trades</p>
            <p className="text-3xl font-bold text-gray-900">{trades.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-gray-600 text-sm">Avg P&L</p>
            <p className="text-3xl font-bold text-purple-600">
              ₹{trades.length > 0 ? (totalPNL / trades.length).toFixed(2) : '0'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8 flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ALL">All Trades</option>
              <option value="ACTIVE">Active Only</option>
              <option value="CLOSED">Closed Only</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="pnl">P&L</option>
              <option value="confidence">Confidence</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Signal
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Entry
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Current
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Target
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    SL
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    P&L
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Conf
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.length > 0 ? (
                  filteredTrades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {trade.symbol}
                        {trade.strikePrice && (
                          <span className="text-xs text-gray-600 ml-1">
                            {trade.strikePrice}
                            {trade.optionType}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.type === 'EQUITY'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getSignalColor(
                            trade.signal
                          )}`}
                        >
                          {trade.signal}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ₹{trade.entryPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-medium">
                        ₹{trade.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">
                        ₹{trade.target.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 font-medium">
                        ₹{trade.stoploss.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold ${
                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ₹{trade.pnl.toFixed(2)}
                        <div className="text-xs text-gray-600">
                          {trade.pnlPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                trade.confidence > 75 ? 'bg-green-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${trade.confidence}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-1">
                          {trade.confidence}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(trade.status)}`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {trade.status === 'ACTIVE' ? (
                          <button
                            onClick={() => closeTrade(trade.id)}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Close
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      No trades found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Winning Trades</h3>
            <div className="space-y-2">
              {trades
                .filter((t) => t.pnl > 0)
                .sort((a, b) => b.pnl - a.pnl)
                .slice(0, 5)
                .map((t) => (
                  <div key={t.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{t.symbol}</span>
                    <span className="text-green-600 font-medium">
                      +₹{t.pnl.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📉 Losing Trades</h3>
            <div className="space-y-2">
              {trades
                .filter((t) => t.pnl < 0)
                .sort((a, b) => a.pnl - b.pnl)
                .slice(0, 5)
                .map((t) => (
                  <div key={t.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{t.symbol}</span>
                    <span className="text-red-600 font-medium">
                      -₹{Math.abs(t.pnl).toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Best Performers</h3>
            <div className="space-y-2">
              {trades
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, 5)
                .map((t) => (
                  <div key={t.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{t.symbol}</span>
                    <span className="text-blue-600 font-medium">
                      {t.confidence}% conf
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

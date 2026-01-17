import React, { useState, useEffect } from 'react';

interface AutomaticTrade {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stoplossPrice: number;
  quantity: number;
  status: 'PENDING' | 'ENTRY_FILLED' | 'TARGET_HIT' | 'STOPLOSS_HIT' | 'CANCELLED';
  profit?: number;
  profitPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ActiveTrades() {
  const [trades, setTrades] = useState<AutomaticTrade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/trading/trades/active');
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const monitorTrades = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/trading/trades/monitor', {
        method: 'POST',
      });
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error monitoring trades:', error);
    }
  };

  const cancelTrade = async (tradeId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/trading/trades/${tradeId}/cancel`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Trade cancelled successfully!');
        fetchTrades();
      }
    } catch (error) {
      console.error('Error cancelling trade:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ENTRY_FILLED':
        return 'bg-blue-100 text-blue-800';
      case 'TARGET_HIT':
        return 'bg-green-100 text-green-800';
      case 'STOPLOSS_HIT':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Active Automated Trades</h1>
        <div className="space-x-4">
          <button
            onClick={monitorTrades}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Monitor Now
          </button>
          <button
            onClick={fetchTrades}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Trades</p>
          <p className="text-3xl font-bold">{trades.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Pending Entry</p>
          <p className="text-3xl font-bold text-yellow-600">
            {trades.filter(t => t.status === 'PENDING').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Target Hit</p>
          <p className="text-3xl font-bold text-green-600">
            {trades.filter(t => t.status === 'TARGET_HIT').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Stoploss Hit</p>
          <p className="text-3xl font-bold text-red-600">
            {trades.filter(t => t.status === 'STOPLOSS_HIT').length}
          </p>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry • Target • SL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trades.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No active trades
                </td>
              </tr>
            ) : (
              trades.map(trade => (
                <tr key={trade.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold">{trade.symbol}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full font-semibold text-sm ${
                      trade.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ₹{trade.entryPrice.toFixed(2)} • ₹{trade.targetPrice.toFixed(2)} • ₹{trade.stoplossPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{trade.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {trade.profit !== undefined ? (
                        <>
                          <p className={`font-semibold ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{trade.profit.toFixed(2)}
                          </p>
                          <p className={`text-xs ${trade.profitPercent! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.profitPercent!.toFixed(2)}%
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-500">-</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {trade.status === 'PENDING' && (
                      <button
                        onClick={() => cancelTrade(trade.id)}
                        className="text-red-600 hover:text-red-900 font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                    {trade.status !== 'PENDING' && (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

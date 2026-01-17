import React, { useState } from 'react';

interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface StrikeOption {
  strike: number;
  ce_bid?: number;
  ce_ask?: number;
  pe_bid?: number;
  pe_ask?: number;
  ce_iv?: number;
  pe_iv?: number;
}

export default function OptionsTrading() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [spotPrice, setSpotPrice] = useState('2750');
  const [strikeInterval, setStrikeInterval] = useState('100');
  const [expiryType, setExpiryType] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');

  // Greeks Calculator
  const [greekSpot, setGreekSpot] = useState('2750');
  const [greekStrike, setGreekStrike] = useState('2800');
  const [daysToExpiry, setDaysToExpiry] = useState('7');
  const [volatility, setVolatility] = useState('30');
  const [greeks, setGreeks] = useState<Greeks | null>(null);
  const [theoreticalPrice, setTheoreticalPrice] = useState<number | null>(null);

  // Strategy Suggestion
  const [marketTrend, setMarketTrend] = useState<'BUY' | 'SELL' | 'NEUTRAL'>('NEUTRAL');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [strikes, setStrikes] = useState<number[]>([]);
  const [expiryDates, setExpiryDates] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getOptionsChains = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/trading/options/chains/${symbol}?spot_price=${spotPrice}&strike_interval=${strikeInterval}`
      );

      const data = await response.json();
      if (data.strikes) {
        setStrikes(data.strikes);
        setExpiryDates(data.expiryDates);
      }
    } catch (error) {
      console.error('Error fetching options chains:', error);
      alert('Error fetching options chains');
    } finally {
      setLoading(false);
    }
  };

  const calculateGreeks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trading/options/greeks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotPrice: parseFloat(greekSpot),
          strikePrice: parseFloat(greekStrike),
          daysToExpiry: parseInt(daysToExpiry),
          volatility: parseFloat(volatility),
          optionType,
        }),
      });

      const data = await response.json();
      if (data.greeks) {
        setGreeks(data.greeks);
        setTheoreticalPrice(data.theoreticalPrice);
      }
    } catch (error) {
      console.error('Error calculating Greeks:', error);
      alert('Error calculating Greeks');
    } finally {
      setLoading(false);
    }
  };

  const suggestStrategy = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/trading/options/strategy/suggest`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketTrend,
            volatility: parseFloat(volatility),
            basePrice: parseFloat(spotPrice),
          }),
        }
      );

      const data = await response.json();
      if (data.suggestedStrategies) {
        setSuggestions(data.suggestedStrategies);
      }
    } catch (error) {
      console.error('Error suggesting strategy:', error);
      alert('Error suggesting strategy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Options Trading Hub</h1>

        {/* Tab Navigation */}
        <div className="mb-8 space-y-6">
          {/* Options Chains Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Options Chains</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spot Price
                </label>
                <input
                  type="number"
                  value={spotPrice}
                  onChange={(e) => setSpotPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strike Interval
                </label>
                <select
                  value={strikeInterval}
                  onChange={(e) => setStrikeInterval(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="50">₹50</option>
                  <option value="100">₹100</option>
                  <option value="200">₹200</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={getOptionsChains}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Get Chains'}
                </button>
              </div>
            </div>

            {/* Expiry Dates */}
            {expiryDates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-700">Weekly Expiry</p>
                  <p className="text-lg font-bold text-blue-600">
                    {expiryDates.weekly}
                  </p>
                  <p className="text-xs text-gray-600">
                    {expiryDates.weeklyDaysLeft} days left
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Monthly Expiry</p>
                  <p className="text-lg font-bold text-purple-600">
                    {expiryDates.monthly}
                  </p>
                  <p className="text-xs text-gray-600">
                    {expiryDates.monthlyDaysLeft} days left
                  </p>
                </div>
              </div>
            )}

            {/* Strikes Grid */}
            {strikes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Available Strikes</p>
                <div className="grid grid-cols-3 md:grid-cols-8 gap-2">
                  {strikes.slice(-16).map((strike) => (
                    <button
                      key={strike}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium border border-gray-300"
                    >
                      {strike}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Greeks Calculator */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🧮 Greeks Calculator</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spot Price
                </label>
                <input
                  type="number"
                  value={greekSpot}
                  onChange={(e) => setGreekSpot(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strike Price
                </label>
                <input
                  type="number"
                  value={greekStrike}
                  onChange={(e) => setGreekStrike(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days to Expiry
                </label>
                <input
                  type="number"
                  value={daysToExpiry}
                  onChange={(e) => setDaysToExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volatility (%)
                </label>
                <input
                  type="number"
                  value={volatility}
                  onChange={(e) => setVolatility(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Option Type
                </label>
                <select
                  value={optionType}
                  onChange={(e) => setOptionType(e.target.value as 'CE' | 'PE')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="CE">Call (CE)</option>
                  <option value="PE">Put (PE)</option>
                </select>
              </div>
            </div>

            <button
              onClick={calculateGreeks}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 mb-4"
            >
              {loading ? 'Calculating...' : 'Calculate Greeks'}
            </button>

            {/* Greeks Display */}
            {greeks && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-xs text-gray-600">Delta</p>
                  <p className="text-2xl font-bold text-green-600">
                    {greeks.delta.toFixed(3)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Price sensitivity</p>
                </div>

                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-xs text-gray-600">Gamma</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {greeks.gamma.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Delta acceleration</p>
                </div>

                <div className="p-4 bg-red-50 rounded">
                  <p className="text-xs text-gray-600">Theta</p>
                  <p className="text-2xl font-bold text-red-600">
                    {greeks.theta.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Time decay</p>
                </div>

                <div className="p-4 bg-purple-50 rounded">
                  <p className="text-xs text-gray-600">Vega</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {greeks.vega.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">IV sensitivity</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded">
                  <p className="text-xs text-gray-600">Rho</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {greeks.rho.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Rate sensitivity</p>
                </div>
              </div>
            )}

            {theoreticalPrice !== null && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-600">Theoretical Price</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{theoreticalPrice.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Strategy Suggester */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              💡 Strategy Suggester
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market Trend
                </label>
                <select
                  value={marketTrend}
                  onChange={(e) => setMarketTrend(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="BUY">🟢 Bullish</option>
                  <option value="SELL">🔴 Bearish</option>
                  <option value="NEUTRAL">🟡 Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volatility
                </label>
                <select
                  value={volatility}
                  onChange={(e) => setVolatility(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="10">Low (10%)</option>
                  <option value="30">Normal (30%)</option>
                  <option value="50">High (50%)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={suggestStrategy}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading ? 'Suggesting...' : 'Suggest Strategy'}
                </button>
              </div>
            </div>

            {/* Suggestions Display */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-purple-800 font-medium">✅ {suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

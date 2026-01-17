import React, { useState, useEffect } from 'react';

interface MarketAnalysis {
  symbol: string;
  trend: string;
  confidence: number;
  aiScore: number;
  technicalScore: number;
  signals: any;
  patterns: string[];
  recommendations: string[];
}

export default function MarketAnalysisDashboard() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [instrumentToken, setInstrumentToken] = useState('738561');
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [multiFrame, setMultiFrame] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const analyzeMarket = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trading/market-analysis/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          instrumentToken: parseInt(instrumentToken),
          interval: 'hour',
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing market:', error);
      alert('Error analyzing market');
    } finally {
      setLoading(false);
    }
  };

  const analyzeMultiTimeframe = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/trading/market-analysis/multi-timeframe/${symbol}/${instrumentToken}`
      );

      const data = await response.json();
      if (data.analyses) {
        setMultiFrame(data.analyses);
        setActiveTab('multiframe');
      }
    } catch (error) {
      console.error('Error analyzing multi-timeframe:', error);
      alert('Error analyzing multi-timeframe');
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend: string) => {
    if (trend.includes('BUY')) return 'bg-green-100 text-green-800';
    if (trend.includes('SELL')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getTrendIcon = (trend: string) => {
    if (trend.includes('BUY')) return '📈';
    if (trend.includes('SELL')) return '📉';
    return '➡️';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Advanced AI Market Analysis
        </h1>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrument Token
              </label>
              <input
                type="text"
                value={instrumentToken}
                onChange={(e) => setInstrumentToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 items-end">
              <button
                onClick={analyzeMarket}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Analyzing...' : 'AI Analysis'}
              </button>

              <button
                onClick={analyzeMultiTimeframe}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                Multi-Timeframe
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'current'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Current Analysis
          </button>

          <button
            onClick={() => setActiveTab('multiframe')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'multiframe'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Multi-Timeframe
          </button>
        </div>

        {/* Current Analysis */}
        {activeTab === 'current' && analysis && (
          <div className="space-y-6">
            {/* Main Metrics */}
            <div className={`rounded-lg shadow-lg p-6 ${getTrendColor(analysis.trend)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">Market Trend</p>
                  <p className="text-3xl font-bold flex items-center gap-2">
                    {getTrendIcon(analysis.trend)} {analysis.trend}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium opacity-75">Confidence</p>
                  <p className="text-3xl font-bold">
                    {analysis.confidence.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600 mb-2">AI Score</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analysis.aiScore}%` }}
                  ></div>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {analysis.aiScore.toFixed(1)}/100
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600 mb-2">Technical Score</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${analysis.technicalScore}%` }}
                  ></div>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {analysis.technicalScore.toFixed(1)}/100
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600 mb-2">Sentiment Score</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.signals.rsi > 50 ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.abs(analysis.signals.rsi - 50) * 2}%` }}
                  ></div>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analysis.signals.rsi > 50 ? '📈' : '📉'}
                </p>
              </div>
            </div>

            {/* Technical Signals */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Technical Signals</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Price</p>
                  <p className="text-lg font-bold">₹{analysis.signals.price.toFixed(2)}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">RSI (14)</p>
                  <p className={`text-lg font-bold ${analysis.signals.rsi > 70 ? 'text-red-600' : analysis.signals.rsi < 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {analysis.signals.rsi.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">MACD</p>
                  <p className={`text-lg font-bold ${analysis.signals.macd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analysis.signals.macd.toFixed(4)}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">ATR</p>
                  <p className="text-lg font-bold">₹{analysis.signals.atr.toFixed(2)}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">MA (20)</p>
                  <p className="text-lg font-bold">₹{analysis.signals.ma20.toFixed(2)}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">MA (50)</p>
                  <p className="text-lg font-bold">₹{analysis.signals.ma50.toFixed(2)}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Bollinger Upper</p>
                  <p className="text-lg font-bold">₹{analysis.signals.bollingerUpper.toFixed(2)}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Bollinger Lower</p>
                  <p className="text-lg font-bold">₹{analysis.signals.bollingerLower.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Patterns Detected */}
            {analysis.patterns.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Patterns Detected</h3>

                <div className="flex flex-wrap gap-2">
                  {analysis.patterns.map((pattern, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      🎯 {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h3>

                <div className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800"
                    >
                      💡 {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Multi-Timeframe Analysis */}
        {activeTab === 'multiframe' && multiFrame && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(multiFrame).map(([timeframe, data]: [string, any]) => (
              <div key={timeframe} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold text-gray-900 mb-3 capitalize">
                  {timeframe === 'fiveMinute'
                    ? '5M'
                    : timeframe === 'fifteenMinute'
                    ? '15M'
                    : timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </h3>

                <div className={`p-2 rounded mb-2 ${getTrendColor(data.trend)}`}>
                  <p className="text-xs font-medium">{data.trend}</p>
                  <p className="text-lg font-bold">
                    {data.confidence.toFixed(0)}%
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-gray-600">AI:</span>
                    <span className="font-bold ml-1">{data.aiScore.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tech:</span>
                    <span className="font-bold ml-1">{data.technicalScore.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">RSI:</span>
                    <span className="font-bold ml-1">{data.signals.rsi.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

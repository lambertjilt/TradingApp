import React, { useState } from 'react';

interface TradeConfig {
  maxPositionSize: number;
  maxLossPercent: number;
  minRiskRewardRatio: number;
  autoExecute: boolean;
  stoplossBracketOrder: boolean;
  riskPerTrade: number;
}

export default function ZerodhaConfig() {
  const [apiKey, setApiKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [tradeConfig, setTradeConfig] = useState<TradeConfig>({
    maxPositionSize: 10,
    maxLossPercent: 2,
    minRiskRewardRatio: 1.5,
    autoExecute: false,
    stoplossBracketOrder: true,
    riskPerTrade: 10000,
  });

  const connectZerodha = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/trading/zerodha/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, accessToken, userId }),
      });

      const data = await response.json();
      if (response.ok) {
        setConnected(true);
        setUser(data);
        localStorage.setItem('zerodha_config', JSON.stringify({ apiKey, accessToken, userId }));
      } else {
        alert('Failed to connect: ' + data.error);
      }
    } catch (error) {
      alert('Error connecting to Zerodha: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setUser(null);
    setApiKey('');
    setAccessToken('');
    setUserId('');
    localStorage.removeItem('zerodha_config');
  };

  const saveTradeConfig = () => {
    localStorage.setItem('trade_config', JSON.stringify(tradeConfig));
    alert('Trading configuration saved!');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Zerodha Configuration</h1>

      {/* Connection Status */}
      <div className={`rounded-lg p-6 mb-8 ${
        connected ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Connection Status</p>
            <p className="text-lg font-semibold">{connected ? '✓ Connected' : '✗ Disconnected'}</p>
            {user && <p className="text-sm text-gray-600 mt-2">User: {user.user}</p>}
          </div>
          {connected && (
            <button
              onClick={disconnect}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Zerodha Credentials */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Zerodha API Credentials</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={connected}
              placeholder="Your Zerodha API Key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Get from Zerodha Console → Settings</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={connected}
              placeholder="Your Access Token"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Obtained after OAuth authentication</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={connected}
              placeholder="Your Zerodha User ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
          </div>

          {!connected && (
            <button
              onClick={connectZerodha}
              disabled={loading || !apiKey || !accessToken || !userId}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Zerodha'}
            </button>
          )}
        </div>
      </div>

      {/* Trading Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Trading Parameters</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Position Size (Qty)
              </label>
              <input
                type="number"
                value={tradeConfig.maxPositionSize}
                onChange={(e) => setTradeConfig({...tradeConfig, maxPositionSize: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Loss Per Trade (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={tradeConfig.maxLossPercent}
                onChange={(e) => setTradeConfig({...tradeConfig, maxLossPercent: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Risk:Reward Ratio
              </label>
              <input
                type="number"
                step="0.1"
                value={tradeConfig.minRiskRewardRatio}
                onChange={(e) => setTradeConfig({...tradeConfig, minRiskRewardRatio: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Per Trade (₹)
              </label>
              <input
                type="number"
                step="100"
                value={tradeConfig.riskPerTrade}
                onChange={(e) => setTradeConfig({...tradeConfig, riskPerTrade: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={tradeConfig.autoExecute}
                onChange={(e) => setTradeConfig({...tradeConfig, autoExecute: e.target.checked})}
                className="rounded"
              />
              <span className="ml-3 text-sm">Auto-execute trades when signals are generated</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={tradeConfig.stoplossBracketOrder}
                onChange={(e) => setTradeConfig({...tradeConfig, stoplossBracketOrder: e.target.checked})}
                className="rounded"
              />
              <span className="ml-3 text-sm">Use bracket orders for target & stoploss</span>
            </label>
          </div>

          <button
            onClick={saveTradeConfig}
            className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 mt-6"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Documentation */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
        <h3 className="font-semibold text-blue-900 mb-2">How to Get Zerodha Credentials</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Sign up for a Zerodha account at zerodha.com</li>
          <li>Go to Console → Settings → API Console</li>
          <li>Generate API Key and get your access token</li>
          <li>Find your User ID in Console → Settings</li>
          <li>Enter credentials above and click Connect</li>
        </ol>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

interface ZerodhaConfig {
  apiKey: string;
  accessToken: string;
  userId: string;
}

interface ConnectionStatus {
  connected: boolean;
  userName?: string;
  email?: string;
  error?: string;
}

export default function ZerodhaConnect() {
  const [config, setConfig] = useState<ZerodhaConfig>({
    apiKey: '',
    accessToken: '',
    userId: '',
  });

  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(!localStorage.getItem('zerodha_config'));

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trading/zerodha/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          connected: true,
          userName: data.user,
          email: data.email,
        });
        localStorage.setItem('zerodha_config', JSON.stringify(config));
        setShowForm(false);
      } else {
        setStatus({
          connected: false,
          error: data.error || 'Connection failed',
        });
      }
    } catch (error: any) {
      setStatus({
        connected: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setStatus({ connected: false });
    localStorage.removeItem('zerodha_config');
    setConfig({ apiKey: '', accessToken: '', userId: '' });
    setShowForm(true);
  };

  const loadSavedConfig = () => {
    const saved = localStorage.getItem('zerodha_config');
    if (saved) {
      const parsedConfig = JSON.parse(saved);
      setConfig(parsedConfig);
      setShowForm(false);
    }
  };

  React.useEffect(() => {
    loadSavedConfig();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🔗 Zerodha Connection</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full ${
              status.connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <span className="text-sm font-medium">
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {status.connected && !showForm ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✅ Connected to Zerodha</p>
            <p className="text-green-700 text-sm mt-1">User ID: {status.userName}</p>
            <p className="text-green-700 text-sm">Email: {status.email}</p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Update Credentials
          </button>

          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      ) : null}

      {showForm ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your API Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Token
            </label>
            <input
              type="password"
              value={config.accessToken}
              onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your Access Token"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={config.userId}
              onChange={(e) => setConfig({ ...config, userId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your User ID"
            />
          </div>

          {status.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">❌ {status.error}</p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !config.apiKey || !config.accessToken || !config.userId}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? '⏳ Connecting...' : '🔗 Connect to Zerodha'}
          </button>

          <p className="text-xs text-gray-600 text-center">
            💡 Get your credentials from Zerodha Developer Console
          </p>
        </div>
      ) : null}
    </div>
  );
}

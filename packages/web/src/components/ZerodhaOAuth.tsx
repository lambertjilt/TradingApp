import React, { useState } from 'react';

interface Step {
  number: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function ZerodhaOAuth() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [requestToken, setRequestToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [accountError, setAccountError] = useState('');

  const [steps, setSteps] = useState<Step[]>([
    {
      number: 1,
      title: 'Get API Credentials',
      description: 'Get your API Key and Secret from Zerodha',
      completed: false,
    },
    {
      number: 2,
      title: 'Login & Authorize',
      description: 'Login to Zerodha and authorize the app',
      completed: false,
    },
    {
      number: 3,
      title: 'Generate Access Token',
      description: 'Exchange request token for access token',
      completed: false,
    },
  ]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Auto-load credentials from credentials.json on component mount
  React.useEffect(() => {
    if (autoLoginAttempted) return;
    
    const loadCredentials = async () => {
      try {
        const response = await fetch('/credentials.json');
        if (response.ok) {
          const credentials = await response.json();
          if (credentials.api_key && credentials.api_secret && credentials.request_token) {
            setApiKey(credentials.api_key);
            setApiSecret(credentials.api_secret);
            setRequestToken(credentials.request_token);
            setCurrentStep(3);
            setAutoLoginAttempted(true);
            
            // Auto-generate access token
            setTimeout(() => {
              autoGenerateAccessToken(credentials.api_key, credentials.api_secret, credentials.request_token);
            }, 500);
          }
        }
      } catch (error) {
        console.log('No credentials.json found or error loading it');
      }
    };

    loadCredentials();
  }, [autoLoginAttempted]);

  // Step 1: Get credentials info
  const showCredentialsInfo = () => {
    alert(
      `How to get Zerodha API Credentials:

1. Visit: https://kite.zerodha.com
2. Login with your account
3. Go to: Settings → API Tokens
4. Click "Create new token" or use existing one
5. Copy the API Key
6. The API Secret is shown only once when you create it
7. Save both securely

OR if you already have a token:
1. Visit: https://kite.zerodha.com/developer
2. Under "Keys", find your API Key and Secret
3. Copy and paste them below`
    );
  };

  // Step 2: Generate login URL
  const generateLoginUrl = async () => {
    if (!apiKey) {
      alert('Please enter API Key first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/zerodha/auth/login-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          redirectUrl: `${window.location.origin}/auth-callback`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep(2);

        // Open Zerodha login in new window
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const loginWindow = window.open(
          data.loginUrl,
          'Zerodha Login',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Poll for request token from local storage
        const pollInterval = setInterval(() => {
          const token = localStorage.getItem('zerodha_request_token');
          if (token) {
            clearInterval(pollInterval);
            setRequestToken(token);
            setCurrentStep(3);
            if (loginWindow) loginWindow.close();
          }
        }, 1000);

        // Stop polling after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate access token (used when loading from credentials.json)
  const autoGenerateAccessToken = async (key: string, secret: string, token: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/zerodha/auth/generate-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestToken: token,
            apiKey: key,
            apiSecret: secret,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAccessToken(data.accessToken);
        setUserId(data.userId);

        // Save to localStorage
        const credentials = {
          apiKey: key,
          accessToken: data.accessToken,
          userId: data.userId,
          generatedAt: new Date().toISOString(),
        };

        localStorage.setItem('zerodha_credentials', JSON.stringify(credentials));

        // Mark steps as completed
        const updatedSteps = steps.map((s) => ({
          ...s,
          completed: true,
        }));
        setSteps(updatedSteps);

        console.log('✅ Auto-logged in with credentials.json');
      } else {
        console.error('Error auto-generating token:', data.error);
      }
    } catch (error: any) {
      console.error('Auto-login error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate access token
  const generateAccessToken = async () => {
    if (!requestToken || !apiSecret) {
      alert('Please enter Request Token and API Secret');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/zerodha/auth/generate-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestToken,
            apiKey,
            apiSecret,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAccessToken(data.accessToken);
        setUserId(data.userId);

        // Save to localStorage
        const credentials = {
          apiKey,
          accessToken: data.accessToken,
          userId: data.userId,
          generatedAt: new Date().toISOString(),
        };

        localStorage.setItem('zerodha_credentials', JSON.stringify(credentials));

        // Mark steps as completed
        const updatedSteps = steps.map((s) => ({
          ...s,
          completed: true,
        }));
        setSteps(updatedSteps);

        alert('✅ Access Token Generated Successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manual request token entry (if user already has it)
  const useExistingToken = () => {
    const token = prompt(
      'Paste your Request Token from the redirect URL:\n\nLook for: ?request_token=XXXXX in the URL'
    );

    if (token) {
      setRequestToken(token);
      setCurrentStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🔐 Zerodha OAuth Authentication
        </h1>
        <p className="text-gray-600 mb-8">
          Secure connection to Zerodha API using OAuth 2.0
        </p>

        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                    step.completed
                      ? 'bg-green-500'
                      : currentStep === step.number
                      ? 'bg-blue-600'
                      : 'bg-gray-400'
                  }`}
                >
                  {step.completed ? '✓' : step.number}
                </div>
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute w-24 h-1 bg-gray-300 mt-6 ml-32 -z-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Get Credentials */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Step 1️⃣ Get API Credentials
          </h2>

          <div className="mb-6">
            <button
              onClick={showCredentialsInfo}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              📖 How to Get Credentials?
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g., abcd1234efgh5678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Secret (Keep Secure!)
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Your API Secret"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                ⚠️ Never share your API Secret. It's shown only once during creation.
              </p>
            </div>

            <button
              onClick={generateLoginUrl}
              disabled={loading || !apiKey || !apiSecret}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? '⏳ Loading...' : '▶️ Next: Login to Zerodha'}
            </button>
          </div>
        </div>

        {/* Step 2: Zerodha Login Info */}
        {currentStep >= 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Step 2️⃣ Login & Authorize
            </h2>

            <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
              <p className="text-yellow-900">
                <strong>A new window has opened.</strong> Please:
              </p>
              <ol className="list-decimal list-inside text-yellow-900 mt-2 space-y-1">
                <li>Login with your Zerodha credentials</li>
                <li>Authorize this app to access your account</li>
                <li>You will be redirected with a request token in the URL</li>
                <li>Copy that token and paste it below</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Token (from redirect URL)
              </label>
              <input
                type="text"
                value={requestToken}
                onChange={(e) => setRequestToken(e.target.value)}
                placeholder="Paste the request_token from URL: ?request_token=XXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <button
                onClick={useExistingToken}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mb-4"
              >
                📋 Already have request token? Paste it
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generate Access Token */}
        {currentStep >= 3 && requestToken && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Step 3️⃣ Generate Access Token
            </h2>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
              <p className="text-blue-900">
                Now we'll exchange your request token for an access token. This will give us
                permission to access your Zerodha account.
              </p>
            </div>

            <button
              onClick={generateAccessToken}
              disabled={loading || !requestToken || !apiSecret}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium text-lg"
            >
              {loading ? '⏳ Generating...' : '✨ Generate Access Token'}
            </button>
          </div>
        )}

        {/* Success State */}
        {accessToken && (
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              ✅ Authentication Complete!
            </h2>

            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-900 font-medium mb-2">Your Credentials:</p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>User ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{userId}</code>
                  </p>
                  <p>
                    <strong>Access Token:</strong>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {accessToken.substring(0, 20)}...
                    </code>
                  </p>
                  <p className="text-xs text-gray-600">
                    ℹ️ Credentials saved to localStorage automatically
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-900">
                  <strong>Next:</strong> Go to the Trading App and all credentials will be pre-filled!
                </p>
              </div>

              <button
                onClick={() => window.location.href = '/zerodha'}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                🚀 Go to Trading App
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">❓ Troubleshooting</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-medium">Request Token not showing?</p>
              <p>Check the URL in the redirect. It should have: ?request_token=XXXXX&status=success</p>
            </div>
            <div>
              <p className="font-medium">Invalid API Key?</p>
              <p>Visit https://kite.zerodha.com/developer and verify your credentials</p>
            </div>
            <div>
              <p className="font-medium">Token expired?</p>
              <p>Zerodha tokens are valid for 24 hours. Generate a new one after expiry.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

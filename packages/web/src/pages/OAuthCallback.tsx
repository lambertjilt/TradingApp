import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get request token from URL
        const params = new URLSearchParams(window.location.search);
        const requestToken = params.get('request_token');
        const status_code = params.get('status');

        if (status_code === 'success' && requestToken) {
          // Save to localStorage
          localStorage.setItem('zerodha_request_token', requestToken);
          setStatus('✅ Authorization successful! Redirecting...');

          // Redirect back to oauth page
          setTimeout(() => {
            window.location.href = '/oauth';
          }, 1500);
        } else {
          setError('Authorization failed or was cancelled');
        }
      } catch (err: any) {
        setError(`Error: ${err.message}`);
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🔐 OAuth Callback
        </h1>

        {error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-900 font-medium">{error}</p>
            <button
              onClick={() => navigate('/oauth')}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ← Go Back
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-900 font-medium">{status}</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

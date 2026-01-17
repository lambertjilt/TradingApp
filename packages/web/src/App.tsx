import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';

// Pages
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import Login from './pages/Login';
import AutomaticTradingPage from './pages/AutomaticTrading';

// Components
import MarketAnalysisDashboard from './components/MarketAnalysisDashboard';
import OptionsTrading from './components/OptionsTrading';
import MultiEquityTrading from './components/MultiEquityTrading';
import ZerodhaConnect from './components/ZerodhaConnect';
import AIAutoTrading from './components/AIAutoTrading';
import OptionsAutoTrading from './components/OptionsAutoTrading';
import TradingMonitor from './components/TradingMonitor';
import ZerodhaOAuth from './components/ZerodhaOAuth';
import OAuthCallback from './pages/OAuthCallback';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen flex flex-col">
          {/* Navigation */}
          <nav className="bg-gray-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold">Trading App</h1>
                </div>
                <div className="flex gap-4 text-sm">
                  <Link to="/" className="hover:text-blue-400">Dashboard</Link>
                  <Link to="/oauth" className="hover:text-blue-400">🔐 OAuth</Link>
                  <Link to="/trade-monitor" className="hover:text-blue-400">📊 Monitor</Link>
                  <Link to="/zerodha" className="hover:text-blue-400">🔗 Zerodha</Link>
                  <Link to="/ai-auto-trading" className="hover:text-blue-400">🤖 AI</Link>
                  <Link to="/options-auto" className="hover:text-blue-400">📈 Options</Link>
                  <Link to="/market-analysis" className="hover:text-blue-400">Market</Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/oauth" element={<ZerodhaOAuth />} />
              <Route path="/auth-callback" element={<OAuthCallback />} />
              <Route path="/trade-monitor" element={<TradingMonitor />} />
              <Route path="/zerodha" element={<ZerodhaConnect />} />
              <Route path="/ai-auto-trading" element={<AIAutoTrading />} />
              <Route path="/options-auto" element={<OptionsAutoTrading />} />
              <Route path="/market-analysis" element={<MarketAnalysisDashboard />} />
              <Route path="/options-trading" element={<OptionsTrading />} />
              <Route path="/multi-equity" element={<MultiEquityTrading />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/automatic-trading" element={<AutomaticTradingPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;

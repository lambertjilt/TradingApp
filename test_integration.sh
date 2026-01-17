#!/bin/bash
# Integration Testing Guide for Trading App

echo "🎯 Trading App - Integration Testing Guide"
echo "==========================================="
echo ""

# Test 1: Backend Server Status
echo "📋 Test 1: Backend Server Status"
echo "Testing: http://localhost:5000/api/health"
curl -s http://localhost:5000/api/health 2>/dev/null || echo "❌ Backend not responding"
echo ""

# Test 2: Frontend App Status
echo "📋 Test 2: Frontend App Status"
echo "Testing: http://localhost:5173"
curl -s -I http://localhost:5173 2>/dev/null | head -1 || echo "❌ Frontend not responding"
echo ""

# Test 3: Zerodha Connection Test
echo "📋 Test 3: Zerodha Connection (Requires Credentials)"
echo "Endpoint: POST /api/trading/zerodha/connect"
echo "Body:"
cat << 'EOF'
{
  "apiKey": "YOUR_API_KEY",
  "accessToken": "YOUR_ACCESS_TOKEN",
  "userId": "YOUR_USER_ID"
}
EOF
echo ""
echo ""

# Test 4: Market Analysis API
echo "📋 Test 4: Market Analysis API"
echo "Endpoint: POST /api/trading/market-analysis/ai"
echo "Body:"
cat << 'EOF'
{
  "symbol": "RELIANCE",
  "instrumentToken": 738561,
  "timeframe": "15m"
}
EOF
echo ""
echo ""

# Test 5: Options Chains
echo "📋 Test 5: Options Chains API"
echo "Endpoint: GET /api/trading/options/chains/RELIANCE?spot_price=2750&strike_interval=100"
echo ""

# Test 6: Greeks Calculator
echo "📋 Test 6: Greeks Calculator API"
echo "Endpoint: POST /api/trading/options/greeks"
echo "Body:"
cat << 'EOF'
{
  "spotPrice": 2750,
  "strikePrice": 2800,
  "daysToExpiry": 7,
  "volatility": 30,
  "optionType": "CE"
}
EOF
echo ""
echo ""

# Test 7: Strategy Suggester
echo "📋 Test 7: Strategy Suggester API"
echo "Endpoint: POST /api/trading/options/strategy/suggest"
echo "Body:"
cat << 'EOF'
{
  "marketTrend": "BUY",
  "volatility": 30,
  "basePrice": 2750
}
EOF
echo ""
echo ""

# Test 8: Historical Data
echo "📋 Test 8: Historical Data API"
echo "Endpoint: GET /api/trading/historical-data/RELIANCE/738561?interval=5m&days=5"
echo ""

# Test 9: Multi-Timeframe Analysis
echo "📋 Test 9: Multi-Timeframe Analysis API"
echo "Endpoint: GET /api/trading/market-analysis/multi-timeframe/RELIANCE/738561"
echo ""

# Test 10: Portfolio Instruments
echo "📋 Test 10: Portfolio Instruments API"
echo "Endpoint: GET /api/trading/portfolio/instruments"
echo ""

# Test 11: Account Margins
echo "📋 Test 11: Account Margins API"
echo "Endpoint: GET /api/trading/account/margins"
echo ""

echo "✅ Integration Testing Guide Complete"
echo ""
echo "🚀 How to Run Tests:"
echo "1. Install curl: sudo apt-get install curl (Linux) or brew install curl (Mac)"
echo "2. Run: bash test_integration.sh"
echo "3. Update API keys in Test 3 with actual credentials"
echo "4. Run individual curl commands to test each endpoint"
echo ""
echo "📝 Example curl command for Test 4 (AI Market Analysis):"
echo 'curl -X POST http://localhost:5000/api/trading/market-analysis/ai \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
echo '    "symbol": "RELIANCE",
echo '    "instrumentToken": 738561,
echo '    "timeframe": "15m"
echo '  }'"'"
echo ""

@echo off
REM Integration Testing Guide for Trading App (Windows)

echo.
echo 🎯 Trading App - Integration Testing Guide (Windows)
echo =====================================================
echo.

REM Test 1: Backend Server Status
echo 📋 Test 1: Backend Server Status
echo Testing: http://localhost:5000/api/health
curl -s http://localhost:5000/api/health 2>nul || echo ❌ Backend not responding
echo.

REM Test 2: Frontend App Status
echo 📋 Test 2: Frontend App Status
echo Testing: http://localhost:5173
curl -s -I http://localhost:5173 2>nul | findstr /i "HTTP" || echo ❌ Frontend not responding
echo.

REM Test 3: Zerodha Connection Test
echo 📋 Test 3: Zerodha Connection (Requires Credentials)
echo Endpoint: POST /api/trading/zerodha/connect
echo Body:
echo {
echo   "apiKey": "YOUR_API_KEY",
echo   "accessToken": "YOUR_ACCESS_TOKEN",
echo   "userId": "YOUR_USER_ID"
echo }
echo.
echo.

REM Test 4: Market Analysis API
echo 📋 Test 4: Market Analysis API
echo Endpoint: POST /api/trading/market-analysis/ai
echo Body:
echo {
echo   "symbol": "RELIANCE",
echo   "instrumentToken": 738561,
echo   "timeframe": "15m"
echo }
echo.
echo.

REM Test 5: Options Chains
echo 📋 Test 5: Options Chains API
echo Endpoint: GET /api/trading/options/chains/RELIANCE?spot_price=2750^&strike_interval=100
echo.

REM Test 6: Greeks Calculator
echo 📋 Test 6: Greeks Calculator API
echo Endpoint: POST /api/trading/options/greeks
echo Body:
echo {
echo   "spotPrice": 2750,
echo   "strikePrice": 2800,
echo   "daysToExpiry": 7,
echo   "volatility": 30,
echo   "optionType": "CE"
echo }
echo.
echo.

REM Test 7: Strategy Suggester
echo 📋 Test 7: Strategy Suggester API
echo Endpoint: POST /api/trading/options/strategy/suggest
echo Body:
echo {
echo   "marketTrend": "BUY",
echo   "volatility": 30,
echo   "basePrice": 2750
echo }
echo.
echo.

REM Test 8: Historical Data
echo 📋 Test 8: Historical Data API
echo Endpoint: GET /api/trading/historical-data/RELIANCE/738561?interval=5m^&days=5
echo.

REM Test 9: Multi-Timeframe Analysis
echo 📋 Test 9: Multi-Timeframe Analysis API
echo Endpoint: GET /api/trading/market-analysis/multi-timeframe/RELIANCE/738561
echo.

REM Test 10: Portfolio Instruments
echo 📋 Test 10: Portfolio Instruments API
echo Endpoint: GET /api/trading/portfolio/instruments
echo.

REM Test 11: Account Margins
echo 📋 Test 11: Account Margins API
echo Endpoint: GET /api/trading/account/margins
echo.

echo ✅ Integration Testing Guide Complete
echo.
echo 🚀 How to Run Tests:
echo 1. Download curl for Windows: https://curl.se/download.html
echo 2. Run: test_integration.bat
echo 3. Update API keys with actual credentials
echo 4. Run individual curl commands to test each endpoint
echo.
echo 📝 Example PowerShell command for Test 4 (AI Market Analysis):
echo.
echo $body = @{
echo     symbol = "RELIANCE"
echo     instrumentToken = 738561
echo     timeframe = "15m"
echo } ^| ConvertTo-Json
echo.
echo Invoke-RestMethod -Method Post `
echo   -Uri "http://localhost:5000/api/trading/market-analysis/ai" `
echo   -Headers @{"Content-Type"="application/json"} `
echo   -Body $body
echo.
echo 🎯 Or use this curl command:
echo curl -X POST http://localhost:5000/api/trading/market-analysis/ai ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"symbol\": \"RELIANCE\", \"instrumentToken\": 738561, \"timeframe\": \"15m\"}"
echo.

pause

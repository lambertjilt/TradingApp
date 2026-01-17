@echo off
REM API Testing Script

echo ===== TRADING APP API TESTS =====
echo.

echo TEST 1: Options Greeks Calculator
echo Endpoint: POST /api/trading/options/greeks
echo.
powershell -Command ^
  "$headers = @{'Content-Type'='application/json'}; " ^
  "$body = '{\"spotPrice\":2750,\"strikePrice\":2800,\"daysToExpiry\":7,\"volatility\":30,\"optionType\":\"CE\"}'; " ^
  "try { " ^
  "(Invoke-WebRequest -Uri 'http://localhost:5000/api/trading/options/greeks' -Method Post -Headers $headers -Body $body).Content | ConvertFrom-Json " ^
  "} catch { Write-Host 'ERROR:' $_.Exception.Message }"

echo.
echo TEST 2: Options Chains
echo Endpoint: GET /api/trading/options/chains/RELIANCE
echo.
powershell -Command ^
  "try { " ^
  "(Invoke-WebRequest -Uri 'http://localhost:5000/api/trading/options/chains/RELIANCE?spot_price=2750^&strike_interval=100').Content | ConvertFrom-Json " ^
  "} catch { Write-Host 'ERROR:' $_.Exception.Message }"

echo.
echo TEST 3: Strategy Suggester
echo Endpoint: POST /api/trading/options/strategy/suggest
echo.
powershell -Command ^
  "$headers = @{'Content-Type'='application/json'}; " ^
  "$body = '{\"marketTrend\":\"BUY\",\"volatility\":30,\"basePrice\":2750}'; " ^
  "try { " ^
  "(Invoke-WebRequest -Uri 'http://localhost:5000/api/trading/options/strategy/suggest' -Method Post -Headers $headers -Body $body).Content | ConvertFrom-Json " ^
  "} catch { Write-Host 'ERROR:' $_.Exception.Message }"

echo.
echo TEST 4: Ultimate Strategy (existing)
echo Endpoint: POST /api/trading/ultimate-strategy/analyze
echo.
powershell -Command ^
  "$headers = @{'Content-Type'='application/json'}; " ^
  "$body = '{\"symbol\":\"RELIANCE\"}'; " ^
  "try { " ^
  "(Invoke-WebRequest -Uri 'http://localhost:5000/api/trading/ultimate-strategy/analyze' -Method Post -Headers $headers -Body $body).Content | ConvertFrom-Json " ^
  "} catch { Write-Host 'ERROR:' $_.Exception.Message }"

echo.
echo ===== TESTS COMPLETE =====
pause

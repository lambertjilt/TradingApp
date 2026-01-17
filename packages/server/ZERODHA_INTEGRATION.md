# Zerodha Automated Trading Integration

## Overview

This trading app integrates with Zerodha's API to provide automated trading signals and automatic trade execution with target and stoploss management.

## Features

✅ **Real-time Market Data Integration**
- Connect directly to Zerodha's market data API
- Get live quotes and historical candle data
- Support for multiple timeframes

✅ **Intelligent Signal Detection**
- Multiple technical analysis strategies:
  - Moving Average Crossover (MA_CROSSOVER)
  - Relative Strength Index (RSI)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
- Customizable strategy parameters
- Confidence scoring for each signal

✅ **Automatic Trade Execution**
- Execute trades automatically when signals are generated
- Bracket order support for automatic target and stoploss
- Risk management with position sizing
- Trail stoploss capability

✅ **Trade Monitoring**
- Real-time monitoring of active trades
- Track profit/loss in real-time
- Automatic closure when target or stoploss is hit
- Trade history and analytics

## Setup Instructions

### 1. Zerodha Account Setup

**Prerequisites:**
- Active Zerodha trading account
- Complete KYC verification
- Minimum trading balance

**Get API Credentials:**
1. Login to Zerodha Console: https://console.zerodha.com
2. Navigate to Settings → API Tokens
3. Create a new API app (if not already created)
4. Generate API Key
5. Authenticate and get Access Token
6. Copy your User ID

### 2. Server Configuration

Update `.env` file in `packages/server/`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/trading_app
JWT_SECRET=your-jwt-secret
ZERODHA_API_KEY=your_api_key
ZERODHA_ACCESS_TOKEN=your_access_token
ZERODHA_USER_ID=your_user_id
```

### 3. Web App Configuration

Update `.env` file in `packages/web/`:

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5001
VITE_APP_NAME=Trading App
```

### 4. Connect Zerodha in Web UI

1. Go to Settings → Zerodha Configuration
2. Enter API Key, Access Token, and User ID
3. Click "Connect Zerodha"
4. Configure trading parameters

## API Endpoints

### Zerodha Connection

```
POST /api/trading/zerodha/connect
Content-Type: application/json

{
  "apiKey": "string",
  "accessToken": "string",
  "userId": "string"
}

Response:
{
  "status": "connected",
  "user": "user_id",
  "email": "email@example.com"
}
```

### Get Market Data

```
GET /api/trading/zerodha/data/:symbol?interval=minute&from=2024-01-01&to=2024-01-31

Response:
{
  "symbol": "RELIANCE",
  "currentPrice": 2850.50,
  "candles": [
    {
      "timestamp": "2024-01-01T09:15:00Z",
      "open": 2840.00,
      "high": 2855.00,
      "low": 2835.00,
      "close": 2850.50,
      "volume": 1000000
    }
  ]
}
```

### Generate Trading Signal

```
POST /api/trading/signals/generate
Content-Type: application/json

{
  "symbol": "RELIANCE",
  "strategy": "MA_CROSSOVER",
  "parameters": {
    "shortMA": 9,
    "longMA": 21
  }
}

Response:
{
  "symbol": "RELIANCE",
  "action": "BUY",
  "entry": 2850.50,
  "target": 2890.25,
  "stoploss": 2825.75,
  "quantity": 10,
  "confidence": 75,
  "reason": "MA_CROSSOVER signal detected",
  "timestamp": "2024-01-31T14:30:00Z"
}
```

### Execute Automatic Trade

```
POST /api/trading/trades/execute
Content-Type: application/json

{
  "symbol": "RELIANCE",
  "action": "BUY",
  "entry": 2850.50,
  "target": 2890.25,
  "stoploss": 2825.75,
  "quantity": 10,
  "confidence": 75,
  "reason": "MA_CROSSOVER signal"
}

Response:
{
  "status": "success",
  "trade": {
    "id": "TRADE_1706718600000",
    "symbol": "RELIANCE",
    "action": "BUY",
    "entryPrice": 2850.50,
    "targetPrice": 2890.25,
    "stoplossPrice": 2825.75,
    "quantity": 10,
    "status": "PENDING",
    "createdAt": "2024-01-31T14:30:00Z"
  }
}
```

### Get Active Trades

```
GET /api/trading/trades/active

Response:
{
  "trades": [
    {
      "id": "TRADE_1706718600000",
      "symbol": "RELIANCE",
      "action": "BUY",
      "entryPrice": 2850.50,
      "targetPrice": 2890.25,
      "stoplossPrice": 2825.75,
      "quantity": 10,
      "status": "ENTRY_FILLED",
      "profit": 3950.00,
      "profitPercent": 1.39,
      "createdAt": "2024-01-31T14:30:00Z"
    }
  ]
}
```

### Monitor Trades

```
POST /api/trading/trades/monitor

Response:
{
  "status": "monitored",
  "trades": [...]
}
```

### Cancel Trade

```
POST /api/trading/trades/:tradeId/cancel

Response:
{
  "status": "success",
  "tradeId": "TRADE_1706718600000"
}
```

### Get Positions

```
GET /api/trading/positions

Response:
{
  "positions": [
    {
      "tradingsymbol": "RELIANCE",
      "quantity": 10,
      "buyQuantity": 10,
      "sellQuantity": 0,
      "averagePrice": 2850.50,
      "value": 28505.00,
      "pnl": 395.00
    }
  ]
}
```

### Get Holdings

```
GET /api/trading/holdings

Response:
{
  "holdings": [
    {
      "tradingsymbol": "INFY",
      "quantity": 5,
      "lastPrice": 1620.50,
      "value": 8102.50
    }
  ]
}
```

### Get Orders

```
GET /api/trading/orders

Response:
{
  "orders": [
    {
      "orderId": "123456789",
      "tradingsymbol": "RELIANCE",
      "transactionType": "BUY",
      "quantity": 10,
      "price": 2850.50,
      "status": "COMPLETE"
    }
  ]
}
```

## Trading Strategies

### 1. Moving Average Crossover (MA_CROSSOVER)

Detects when short-term MA crosses above/below long-term MA.

**Parameters:**
- `shortMA`: Short-term moving average period (default: 9)
- `longMA`: Long-term moving average period (default: 21)

**Signals:**
- **BUY**: When 9-day MA crosses above 21-day MA
- **SELL**: When 9-day MA crosses below 21-day MA

### 2. RSI (Relative Strength Index)

Identifies overbought and oversold conditions.

**Parameters:**
- `period`: RSI period (default: 14)

**Signals:**
- **BUY**: When RSI < 30 (oversold)
- **SELL**: When RSI > 70 (overbought)

### 3. MACD (Moving Average Convergence Divergence)

Detects trend changes through MACD line and signal line crossovers.

**Parameters:**
- Fast EMA: 12 periods
- Slow EMA: 26 periods
- Signal: 9 periods

**Signals:**
- **BUY**: When MACD crosses above signal line
- **SELL**: When MACD crosses below signal line

### 4. Bollinger Bands

Identifies price extremes relative to moving average and standard deviation.

**Parameters:**
- `period`: Moving average period (default: 20)
- `deviation`: Standard deviation multiplier (default: 2)

**Signals:**
- **BUY**: When price closes below lower band
- **SELL**: When price closes above upper band

## Risk Management

### Position Sizing

Position size is calculated based on:
```
Position Size = Risk Amount / (Entry - Stoploss)
Risk Amount = Account Balance × Risk Per Trade %
```

### Risk/Reward Ratio

Trades are automatically filtered based on:
```
Minimum Risk:Reward Ratio = 1.5
Risk:Reward = (Target - Entry) / (Entry - Stoploss)
```

### Maximum Loss Per Trade

Configurable limit to prevent excessive losses:
- Default: 2% of portfolio per trade
- Adjustable in trading configuration

## Advanced Features

### Bracket Orders

Automatically places entry, target, and stoploss orders:
- Entry order: Opens the position
- Target order: Profits when price reaches target
- Stoploss order: Cuts losses when price hits stoploss

### Trail Stoploss

Moves stoploss automatically to protect profits:
- Follows price upward in BUY trades
- Follows price downward in SELL trades

### Auto-Execute

Enable automatic trade execution when signals are generated:
- Filters low-confidence signals
- Validates risk/reward ratio
- Respects position size limits

## Monitoring & Analytics

### Real-time Trade Updates

WebSocket connection provides:
- Live price updates
- Trade status changes
- Profit/loss tracking
- Order execution confirmations

### Trade History

View all executed trades with:
- Entry and exit prices
- Actual profit/loss
- Trade duration
- Success rate metrics

## Best Practices

1. **Start Small**: Begin with small position sizes
2. **Test First**: Run on paper trading before live trading
3. **Monitor Closely**: Keep eye on active trades
4. **Adjust Parameters**: Fine-tune strategies based on performance
5. **Risk Management**: Always use stoploss
6. **Diversify**: Trade multiple symbols
7. **Regular Reviews**: Analyze performance weekly

## Troubleshooting

### Connection Issues
```
Error: "Failed to connect to Zerodha"
Solution: Verify API credentials and check Zerodha server status
```

### Signal Not Generated
```
Error: "No market data available"
Solution: Ensure sufficient historical data and correct symbol
```

### Order Rejection
```
Error: "Order rejected"
Possible causes:
- Insufficient margin
- Position size exceeds limits
- Market hours issues
- Invalid price parameters
```

## Security Considerations

1. **API Credentials**: Never share or commit credentials
2. **Environment Variables**: Use .env files, not hardcoded values
3. **HTTPS**: Always use secure connections
4. **Access Tokens**: Refresh tokens regularly
5. **Audit Logs**: Monitor all trade executions

## Support & Documentation

- **Zerodha API Docs**: https://kite.trade
- **Community**: https://rainmatter.com
- **Issue Tracker**: Check GitHub issues

## License

MIT License - See LICENSE file

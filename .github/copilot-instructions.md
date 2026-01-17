# Trading App Development Guide

## Project Overview
Full-stack trading application with:
- **Web Frontend**: React + TypeScript
- **Mobile App**: React Native
- **Backend**: Node.js + Express + WebSocket
- **Database**: PostgreSQL
- **Real-time**: WebSocket support for live price updates

## Project Structure
```
trading-app/
├── packages/
│   ├── shared/          # Shared TypeScript types and utilities
│   ├── server/          # Node.js/Express backend
│   ├── web/             # React web application
│   └── mobile/          # React Native mobile application
├── .github/             # GitHub configuration
├── package.json         # Root workspace configuration
└── README.md           # Project documentation
```

## Development Checklist

- [ ] Install dependencies with `yarn install`
- [ ] Set up environment variables for server and database
- [ ] Configure PostgreSQL database
- [ ] Start backend server: `yarn server`
- [ ] Start web app: `yarn web`
- [ ] Start mobile app: `yarn mobile`
- [ ] Run tests: `yarn test`
- [ ] Build for production: `yarn build`

## Key Features

### Web Application
- Trading dashboard with portfolio overview
- Real-time price charts using TradingView Lightweight Charts
- Order placement and management
- User authentication
- Responsive design

### Mobile Application
- Native iOS and Android support
- Trading interface optimized for mobile
- Push notifications for price alerts
- Offline support capability
- Biometric authentication

### Backend API
- RESTful API endpoints
- WebSocket connection for real-time data
- User authentication and authorization
- Portfolio management
- Order processing and validation
- Real-time price feed integration

## Database Schema

### Users Table
- `id` (PRIMARY KEY)
- `email` (UNIQUE)
- `password_hash`
- `first_name`
- `last_name`
- `created_at`

### Portfolio Table
- `id` (PRIMARY KEY)
- `user_id` (FOREIGN KEY)
- `total_balance`
- `available_balance`
- `updated_at`

### Holdings Table
- `id` (PRIMARY KEY)
- `portfolio_id` (FOREIGN KEY)
- `symbol` (stock symbol)
- `quantity`
- `average_cost`
- `updated_at`

### Orders Table
- `id` (PRIMARY KEY)
- `user_id` (FOREIGN KEY)
- `symbol`
- `type` (BUY/SELL)
- `quantity`
- `price`
- `status` (PENDING/FILLED/CANCELLED)
- `created_at`

### Price History Table
- `id` (PRIMARY KEY)
- `symbol`
- `open_price`
- `close_price`
- `high_price`
- `low_price`
- `volume`
- `timestamp`

## Technology Stack

### Shared
- TypeScript
- Zod (data validation)
- Socket.io-client

### Server
- Node.js 18+
- Express.js
- TypeORM/Prisma (ORM)
- PostgreSQL
- Socket.io
- JWT authentication
- dotenv

### Web
- React 18
- TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Redux Toolkit (state management)
- Socket.io-client (real-time)
- Recharts/TradingView (charting)
- React Router

### Mobile
- React Native
- TypeScript
- React Navigation
- Socket.io-client
- Redux Toolkit
- NativeBase/React Native Paper (UI)

## Getting Started

1. **Install Node.js 18+** and Yarn 3+
2. **Clone/navigate to project directory**
3. **Install dependencies**: `yarn install`
4. **Set up environment variables** (see .env.example files)
5. **Initialize database**: `yarn server setup-db`
6. **Start development servers**:
   - Terminal 1: `yarn server`
   - Terminal 2: `yarn web`
   - Terminal 3: `yarn mobile`

## Environment Variables

Create `.env` files in server and web packages:

### Server (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/trading_app
JWT_SECRET=your-jwt-secret-key
API_PORT=5000
WS_PORT=5001
```

### Web (.env)
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5001
```

## Available Commands

- `yarn install` - Install all dependencies
- `yarn dev` - Start all packages in dev mode
- `yarn build` - Build all packages
- `yarn test` - Run tests across all packages
- `yarn lint` - Lint code
- `yarn clean` - Clean all builds
- `yarn server` - Start backend server
- `yarn web` - Start web application
- `yarn mobile` - Start mobile app

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `GET /api/portfolio/holdings` - Get current holdings
- `GET /api/portfolio/history` - Get portfolio history

### Orders
- `POST /api/orders` - Place new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `DELETE /api/orders/:id` - Cancel order

### Prices
- `GET /api/prices/:symbol` - Get current price
- `GET /api/prices/:symbol/history` - Get price history
- `WS /ws` - WebSocket connection for real-time prices

## Debugging and Development Tips

1. **Server**: Check logs in terminal for API errors
2. **Web**: Use React DevTools and Redux DevTools browser extensions
3. **Mobile**: Use React Native Debugger
4. **Database**: Use pgAdmin or DBeaver for PostgreSQL management
5. **API Testing**: Use Postman or Insomnia

## Testing
- Unit tests: Jest
- Integration tests: Supertest (API)
- E2E tests: Cypress (Web) / Detox (Mobile)

## Deployment

- **Web**: Vercel, Netlify, or AWS S3 + CloudFront
- **Server**: Heroku, AWS EC2, or DigitalOcean
- **Mobile**: iOS App Store and Google Play Store
- **Database**: AWS RDS, Heroku Postgres, or managed PostgreSQL

## Contributing

Follow these guidelines:
1. Create feature branches: `feature/feature-name`
2. Commit messages: `type: description` (feat:, fix:, refactor:, docs:)
3. Submit pull requests for code review
4. Ensure all tests pass before merging

## Support and Contact

For issues or questions, please open a GitHub issue or contact the development team.

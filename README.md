# Trading App - Full Stack Application

A comprehensive trading application with web and mobile clients, real-time price updates, portfolio management, and order placement capabilities.

## Features

✅ **Web Dashboard**
- Real-time trading interface
- Interactive price charts
- Portfolio management
- Order placement and tracking
- User authentication
- Responsive design

✅ **Mobile Application**
- Native iOS and Android apps
- Optimized mobile trading interface
- Real-time price updates
- Push notifications
- Biometric authentication
- Offline capabilities

✅ **Backend Services**
- RESTful API
- Real-time WebSocket connection
- User authentication (JWT)
- Portfolio and order management
- Price feed integration
- Database persistence

## Tech Stack

- **Frontend Web**: React 18, TypeScript, Vite, TailwindCSS
- **Frontend Mobile**: React Native, React Navigation
- **Backend**: Node.js, Express, TypeORM/Prisma
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **State Management**: Redux Toolkit
- **Charts**: TradingView Lightweight Charts, Recharts

## Project Structure

```
trading-app/
├── packages/
│   ├── shared/              # Shared TypeScript utilities and types
│   │   ├── src/
│   │   │   ├── types/      # Shared type definitions
│   │   │   ├── utils/      # Utility functions
│   │   │   └── validation/ # Data validation schemas
│   │   └── package.json
│   │
│   ├── server/              # Backend API server
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers
│   │   │   ├── services/   # Business logic
│   │   │   ├── models/     # Database models
│   │   │   ├── middleware/ # Express middleware
│   │   │   └── app.ts      # Main server file
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── web/                 # React web application
│   │   ├── src/
│   │   │   ├── components/  # Reusable components
│   │   │   ├── pages/       # Page components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── store/       # Redux store configuration
│   │   │   ├── services/    # API services
│   │   │   ├── utils/       # Utility functions
│   │   │   └── App.tsx      # Main app component
│   │   ├── .env.example
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── mobile/              # React Native application
│       ├── src/
│       │   ├── components/  # React Native components
│       │   ├── screens/     # Screen components
│       │   ├── navigation/  # Navigation configuration
│       │   ├── hooks/       # Custom hooks
│       │   ├── store/       # Redux store
│       │   ├── services/    # API services
│       │   └── App.tsx      # Main app component
│       ├── ios/             # iOS native code
│       ├── android/         # Android native code
│       └── package.json
│
├── .github/
│   └── copilot-instructions.md
├── package.json             # Root workspace configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Quick Start

### Prerequisites
- Node.js 18+
- Yarn 3+
- PostgreSQL 14+

### Installation

1. **Install dependencies**
   ```bash
   yarn install
   ```

2. **Set up environment variables**
   ```bash
   # Server
   cp packages/server/.env.example packages/server/.env
   
   # Web
   cp packages/web/.env.example packages/web/.env
   ```

3. **Initialize database**
   ```bash
   yarn workspace @trading-app/server setup-db
   ```

4. **Start development servers**
   ```bash
   # In separate terminals:
   yarn server    # Backend on http://localhost:5000
   yarn web       # Web on http://localhost:5173
   yarn mobile    # Mobile on Expo
   ```

## Available Scripts

### Root Level
- `yarn install` - Install all dependencies
- `yarn dev` - Start all packages in development mode
- `yarn build` - Build all packages for production
- `yarn test` - Run tests in all packages
- `yarn lint` - Lint code in all packages
- `yarn clean` - Clean all build artifacts

### Specific Packages
- `yarn server` - Start backend server only
- `yarn web` - Start web app only
- `yarn mobile` - Start mobile app only

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login user
POST   /auth/logout            - Logout user
GET    /auth/profile           - Get user profile
```

### Portfolio Endpoints
```
GET    /portfolio              - Get user portfolio overview
GET    /portfolio/holdings     - Get current stock holdings
GET    /portfolio/history      - Get portfolio performance history
PUT    /portfolio              - Update portfolio settings
```

### Orders Endpoints
```
POST   /orders                 - Place new order
GET    /orders                 - Get all user orders
GET    /orders/:id             - Get order details
PUT    /orders/:id             - Update order (if pending)
DELETE /orders/:id             - Cancel order
```

### Price Endpoints
```
GET    /prices/:symbol         - Get current price for symbol
GET    /prices/:symbol/history - Get price history
GET    /prices/search          - Search for stock symbols
```

### WebSocket Connection
```
WS /ws                         - Real-time price updates
```

## Environment Variables

### Server (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/trading_app
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
API_CORS_ORIGIN=http://localhost:5173
```

### Web (.env)
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5001
VITE_APP_NAME=Trading App
```

## Database Schema

### Key Tables
- **users** - User accounts and authentication
- **portfolios** - User portfolio information
- **holdings** - Stock holdings per portfolio
- **orders** - Trading orders
- **price_history** - Historical price data
- **transactions** - Trade transaction history

See [copilot-instructions.md](.github/copilot-instructions.md) for detailed schema information.

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** to relevant packages

3. **Run tests**
   ```bash
   yarn test
   ```

4. **Lint code**
   ```bash
   yarn lint
   ```

5. **Commit with semantic messages**
   ```bash
   git commit -m "feat: description of changes"
   ```

6. **Push and create pull request**

## Testing

Each package includes testing setup:
- **Unit Tests**: Jest
- **Integration Tests**: Supertest (Server), React Testing Library (Web)
- **E2E Tests**: Cypress (Web), Detox (Mobile)

Run all tests:
```bash
yarn test
```

## Building for Production

```bash
yarn build
```

Builds are generated in `dist/` directories in each package.

## Deployment

### Server
- Build: `yarn build`
- Deploy to: Heroku, AWS EC2, DigitalOcean, etc.

### Web
- Build: `yarn build`
- Deploy to: Vercel, Netlify, AWS S3 + CloudFront

### Mobile
- iOS: `yarn workspace @trading-app/mobile build-ios`
- Android: `yarn workspace @trading-app/mobile build-android`
- Publish to App Stores

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Run migrations: `yarn server migrate`

### Build Errors
```bash
yarn clean
yarn install
yarn build
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Submit pull requests with detailed descriptions

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions:
1. Open a GitHub Issue
2. Contact the development team
3. Check existing documentation

## Roadmap

- [ ] Advanced charting with technical indicators
- [ ] Paper trading mode
- [ ] Social trading features
- [ ] AI-powered recommendations
- [ ] Mobile app push notifications
- [ ] Two-factor authentication
- [ ] Account verification
- [ ] Multiple currency support

---

**Happy Trading! 📈**

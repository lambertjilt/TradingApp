import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import tradingRoutes from './routes/trading';
import zerodhaAuthRoutes from './routes/zerodha-auth';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: (process.env.API_CORS_ORIGIN || '*').split(','),
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket setup
const io = new Server(server, {
  cors: corsOptions as any,
});

// Socket.io connection handler
io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('subscribe', (symbol: string) => {
    socket.join(`price:${symbol}`);
    console.log(`User subscribed to ${symbol}`);
  });

  socket.on('unsubscribe', (symbol: string) => {
    socket.leave(`price:${symbol}`);
    console.log(`User unsubscribed from ${symbol}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/trading', tradingRoutes);
app.use('/api/zerodha', zerodhaAuthRoutes);

// Health check endpoint
app.get('/api/health', ((req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
}) as RequestHandler);

// Root endpoint
app.get('/', ((req: Request, res: Response) => {
  res.json({ 
    message: 'Trading App API Server with Zerodha Integration',
    version: '1.0.0',
    status: 'running',
    features: [
      'Zerodha API Integration',
      'Automated Signal Detection',
      'Automatic Trade Execution',
      'Real-time Position Monitoring',
      'Bracket Orders with Target & Stoploss'
    ]
  });
}) as RequestHandler);

// 404 handler
app.use(((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
}) as RequestHandler);

// Error handler
app.use(((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
}) as any);

// Start server
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`📊 Zerodha Trading Integration Active`);
  console.log(`📈 Automated Trading Engine Ready`);
});

// Periodic trade monitoring (every 30 seconds)
// setInterval(async () => {
//   TODO: Implement monitoring logic with proper service instance
//   await tradingEngine.monitorTrades();
// }, 30000);

export { app, server, io };

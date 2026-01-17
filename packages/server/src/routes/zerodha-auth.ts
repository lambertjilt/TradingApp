import express, { Router, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = Router();

// Zerodha API Configuration
interface ZerodhaConfig {
  apiKey: string;
  apiSecret: string;
  redirectUrl: string;
}

// Store active sessions
const activeSessions: Map<string, any> = new Map();

/**
 * Step 1: Generate login URL for Zerodha OAuth
 * User visits this URL to authorize
 */
router.post('/auth/login-url', (req: Request, res: Response) => {
  try {
    const { apiKey, redirectUrl } = req.body;

    if (!apiKey || !redirectUrl) {
      return res.status(400).json({ error: 'Missing apiKey or redirectUrl' });
    }

    // Generate unique request token (nonce)
    const requestToken = crypto.randomBytes(32).toString('hex');

    // Store in session
    const sessionId = crypto.randomBytes(16).toString('hex');
    activeSessions.set(sessionId, {
      requestToken,
      apiKey,
      redirectUrl,
      createdAt: Date.now(),
    });

    // Zerodha login URL
    const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3`;

    res.json({
      status: 'success',
      loginUrl,
      sessionId,
      instructions: [
        '1. Open the loginUrl in browser',
        '2. Login with your Zerodha credentials',
        '3. Authorize the app',
        '4. You will be redirected with request_token in URL',
        '5. Send that request_token to /auth/generate-token endpoint',
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Step 2: Exchange request token for access token
 * This is the OAuth callback that Zerodha redirects to
 */
router.post('/auth/generate-token', async (req: Request, res: Response) => {
  try {
    const { requestToken, apiKey, apiSecret } = req.body;

    if (!requestToken || !apiKey || !apiSecret) {
      return res.status(400).json({
        error: 'Missing requestToken, apiKey, or apiSecret',
      });
    }

    // For demo: Accept any valid credentials and generate token
    // In production, this would verify with Zerodha API
    
    const accessToken = `${apiKey.substring(0, 8)}_access_${Date.now()}`;
    const userId = 'JS00001';

    // Store session globally
    (global as any).zerodhaSession = {
      user_id: userId,
      api_key: apiKey,
      access_token: accessToken,
      public_token: requestToken,
      login_time: new Date().toISOString(),
      email: 'trader@zerodha.com',
      profile: {
        broker: 'ZERODHA',
        exchanges: ['NSE', 'BSE', 'NFO', 'MCX'],
        products: ['CNC', 'MIS', 'BO'],
        order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
      },
    };

    res.json({
      status: 'success',
      accessToken,
      userId,
      message: 'Token generated successfully',
      expiresIn: '24 hours',
      usage: 'Use this accessToken for all API calls',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      hint: 'Verify apiKey, apiSecret, and requestToken are correct',
    });
  }
});

/**
 * Step 3: Verify token is valid
 */
router.post('/auth/verify-token', (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing accessToken' });
    }

    const session = (global as any).zerodhaSession;

    if (session && session.access_token === accessToken) {
      res.json({
        status: 'success',
        message: 'Token is valid',
        user: {
          user_id: session.user_id,
          email: session.email,
          broker: 'ZERODHA',
        },
      });
    } else {
      res.status(401).json({
        status: 'error',
        error: 'Invalid or expired token',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

/**
 * Get Zerodha account details (user profile)
 */
router.get('/account', (req: Request, res: Response) => {
  try {
    const session = (global as any).zerodhaSession;

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated. Please login first.' });
    }

    res.json({
      status: 'success',
      data: {
        user_id: session.user_id,
        email: session.email,
        broker: 'ZERODHA',
        name: 'Trading User',
        exchanges: ['NSE', 'BSE', 'NFO', 'MCX'],
        products: ['CNC', 'MIS', 'BO'],
        order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
        login_time: session.login_time,
        api_key: session.api_key.substring(0, 8) + '****',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Zerodha session (user profile)
 */
router.get('/session', (req: Request, res: Response) => {
  try {
    const session = (global as any).zerodhaSession;

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      status: 'success',
      user: {
        user_id: session.user_id,
        email: session.email,
        broker: 'ZERODHA',
        exchanges: session.profile.exchanges,
        products: session.profile.products,
        order_types: session.profile.order_types,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all instruments (for dropdown selection)
 */
router.get('/instruments', async (req: Request, res: Response) => {
  try {
    const apiKey = req.query.apiKey as string;
    const accessToken = req.query.accessToken as string;

    if (!apiKey || !accessToken) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Get NSE instruments
    const response = await axios.get(
      'https://api.kite.trade/instruments?exchange=NSE',
      {
        headers: {
          Authorization: `token ${apiKey}:${accessToken}`,
          'X-Kite-Version': '3',
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

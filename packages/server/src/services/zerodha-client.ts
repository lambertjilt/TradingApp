import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface ZerodhaConfig {
  apiKey: string;
  accessToken: string;
  userId: string;
}

export class ZerodhaClient {
  private client: AxiosInstance;
  private config: ZerodhaConfig;
  private baseURL = 'https://api.kite.trade';

  constructor(config: ZerodhaConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${config.apiKey}:${config.accessToken}`,
      },
    });
  }

  /**
   * Get account holdings
   */
  async getHoldings() {
    try {
      const response = await this.client.get('/portfolio/holdings');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching holdings:', error);
      throw error;
    }
  }

  /**
   * Get current positions
   */
  async getPositions() {
    try {
      const response = await this.client.get('/portfolio/positions');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  /**
   * Get live market data
   */
  async getQuote(instrumentTokens: number[]) {
    try {
      const params = new URLSearchParams();
      instrumentTokens.forEach(token => {
        params.append('i', token.toString());
      });

      const response = await this.client.get(`/quote?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  }

  /**
   * Get historical data (OHLCV)
   */
  async getHistoricalData(
    instrumentToken: number,
    interval: string = 'minute',
    fromDate: string,
    toDate: string
  ) {
    try {
      const response = await this.client.get(
        `/instruments/historical/${instrumentToken}/${interval}`,
        {
          params: {
            from: fromDate,
            to: toDate,
            continuous: 0,
            oi: 1,
          },
        }
      );
      return response.data.data.candles;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  /**
   * Search for instruments
   */
  async searchInstruments(query: string) {
    try {
      const response = await this.client.get('/instruments/search', {
        params: { q: query },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching instruments:', error);
      throw error;
    }
  }

  /**
   * Place a regular order
   */
  async placeOrder(
    tradingsymbol: string,
    exchange: string = 'NSE',
    transactionType: 'BUY' | 'SELL' = 'BUY',
    quantity: number,
    price: number,
    orderType: 'MARKET' | 'LIMIT' = 'LIMIT',
    validity: 'DAY' | 'IOC' | 'GTC' = 'DAY'
  ) {
    try {
      const response = await this.client.post('/orders/regular', {
        tradingsymbol,
        exchange,
        transaction_type: transactionType,
        quantity,
        price: orderType === 'LIMIT' ? price : undefined,
        order_type: orderType,
        validity,
        product: 'MIS', // Intraday
      });
      return response.data.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Place a bracket order (entry + stoploss + target)
   */
  async placeBracketOrder(orderConfig: {
    symbol: string;
    quantity: number;
    side: 'BUY' | 'SELL';
    price: number;
    target: number;
    stoploss: number;
  }) {
    try {
      const { symbol, quantity, side, price, target, stoploss } = orderConfig;
      
      const response = await this.client.post('/orders/bracket', {
        tradingsymbol: symbol,
        exchange: 'NSE',
        transaction_type: side,
        quantity,
        price,
        order_type: 'LIMIT',
        product: 'MIS',
        squareoff: Math.abs(target - price),
        stoploss: Math.abs(price - stoploss),
        trailing_stoploss: 0,
        validity: 'DAY',
      });
      return response.data.data;
    } catch (error) {
      console.error('Error placing bracket order:', error);
      throw error;
    }
  }

  /**
   * Modify an order
   */
  async modifyOrder(
    orderId: string,
    quantity?: number,
    price?: number,
    orderType?: string
  ) {
    try {
      const data: any = { order_id: orderId };
      if (quantity) data.quantity = quantity;
      if (price) data.price = price;
      if (orderType) data.order_type = orderType;

      const response = await this.client.put(`/orders/${orderId}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error modifying order:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, parentOrderId?: string) {
    try {
      const response = await this.client.delete(`/orders/${orderId}`, {
        data: { parent_order_id: parentOrderId },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Get all orders
   */
  async getOrders() {
    try {
      const response = await this.client.get('/orders');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Get trades for a specific order
   */
  async getTrades() {
    try {
      const response = await this.client.get('/trades');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  /**
   * Get account details
   */
  async getProfile() {
    try {
      const response = await this.client.get('/user/profile');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  /**
   * Get margins/account info
   */
  async getMargins() {
    try {
      const response = await this.client.get('/user/margins');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching margins:', error);
      throw error;
    }
  }
}

export default ZerodhaClient;

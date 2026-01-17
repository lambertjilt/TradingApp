import axios from 'axios';

const API_URL = 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  // TODO: Get token from secure storage
  return config;
});

export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
};

export const portfolioAPI = {
  getPortfolio: () => apiClient.get('/portfolio'),
  getHoldings: () => apiClient.get('/portfolio/holdings'),
  getHistory: () => apiClient.get('/portfolio/history'),
};

export const orderAPI = {
  placeOrder: (data: any) => apiClient.post('/orders', data),
  getOrders: () => apiClient.get('/orders'),
  getOrder: (id: string) => apiClient.get(`/orders/${id}`),
  cancelOrder: (id: string) => apiClient.delete(`/orders/${id}`),
};

export const priceAPI = {
  getPrice: (symbol: string) => apiClient.get(`/prices/${symbol}`),
  getPriceHistory: (symbol: string) => apiClient.get(`/prices/${symbol}/history`),
  searchSymbols: (query: string) => apiClient.get(`/prices/search?q=${query}`),
};

export default apiClient;

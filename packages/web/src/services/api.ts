const API_URL = (typeof import !== 'undefined' && typeof import.meta !== 'undefined') 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:5000';

const BASE_URL = `${API_URL}/api`;

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export const authAPI = {
  register: (data: any) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiCall('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiCall('/auth/logout', { method: 'POST' }),
};

export const portfolioAPI = {
  getPortfolio: () => apiCall('/portfolio', { method: 'GET' }),
  getHoldings: () => apiCall('/portfolio/holdings', { method: 'GET' }),
  getHistory: () => apiCall('/portfolio/history', { method: 'GET' }),
};

export const orderAPI = {
  placeOrder: (data: any) => apiCall('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => apiCall('/orders', { method: 'GET' }),
  getOrder: (id: string) => apiCall(`/orders/${id}`, { method: 'GET' }),
  cancelOrder: (id: string) => apiCall(`/orders/${id}`, { method: 'DELETE' }),
};

export const priceAPI = {
  getPrice: (symbol: string) => apiCall(`/prices/${symbol}`, { method: 'GET' }),
  getPriceHistory: (symbol: string) => apiCall(`/prices/${symbol}/history`, { method: 'GET' }),
  searchSymbols: (query: string) => apiCall(`/prices/search?q=${query}`, { method: 'GET' }),
};

export default { authAPI, portfolioAPI, orderAPI, priceAPI };

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const getWsUrl = () => {
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined') {
    return (import.meta.env as any).VITE_WS_URL || 'ws://localhost:5001';
  }
  return 'ws://localhost:5001';
};

const WS_URL = getWsUrl();

let socket: Socket | null = null;

export function useWebSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket = io(WS_URL);

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from WebSocket');
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  const subscribe = (symbol: string) => {
    socket?.emit('subscribe', symbol);
  };

  const unsubscribe = (symbol: string) => {
    socket?.emit('unsubscribe', symbol);
  };

  return { connected, subscribe, unsubscribe, socket };
}

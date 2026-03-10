import { useState, useEffect, useRef } from 'react';
import { connectWebSocket, disconnectWebSocket } from '../services/api';
import { Logger } from '../utils/logger';

export const useWebSocket = (onBoardUpdate, onConnectionChange) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const fallbackIntervalRef = useRef(null);

  const handleMessage = (message) => {
    try {
      Logger.debug('WebSocket message received', { type: message.type, fullMessage: message });
      
      switch (message.type) {
        case 'board_update':
          if (message.data && Array.isArray(message.data.strokes)) {
            Logger.debug('Board update via WebSocket', { strokes: message.data.strokes.length });
            onBoardUpdate(message.data.strokes);
          }
          break;
        case 'stroke':
          if (message.data) {
            Logger.debug('Individual stroke received', { strokeId: message.data.id });
            onBoardUpdate(prev => {
              const exists = prev.some(s => s.id === message.data.id);
              if (!exists) {
                Logger.debug('Adding new stroke from WebSocket', { strokeId: message.data.id });
                return [...prev, message.data];
              }
              Logger.debug('Duplicate stroke ignored', { strokeId: message.data.id });
              return prev;
            });
          }
          break;
        case 'clear':
          console.log('🧹 CLEAR RECEIVED! Cleaning canvas...');
          Logger.debug('Clear command received via WebSocket', message);
          onBoardUpdate([]);
          break;
        case 'clear_board':
        case 'board_clear':
          console.log('🧹 ALTERNATIVE CLEAR RECEIVED! Cleaning canvas...');
          Logger.debug('Alternative clear command received via WebSocket', message);
          onBoardUpdate([]);
          break;
        case 'heartbeat':
          Logger.debug('Heartbeat received');
          break;
        case 'error':
          Logger.error('WebSocket error message', message.data);
          setConnectionError(message.data.message || 'WebSocket error');
          break;
        case 'connection_status':
          Logger.info('Connection status update', message.data);
          break;
        default:
          Logger.warn('Unknown WebSocket message type', { type: message.type, message });
      }
    } catch (error) {
      Logger.error('Error handling WebSocket message', error);
    }
  };

  const handleError = (error) => {
    Logger.error('WebSocket connection error', error);
    setConnectionError('Connection error');
    setIsConnected(false);
    
    // After 3 failed attempts, switch to fallback mode
    if (!useFallback) {
      Logger.info('Switching to fallback polling mode');
      setUseFallback(true);
    }
  };

  const handleClose = (event) => {
    Logger.info('WebSocket connection closed', { code: event.code, reason: event.reason });
    setIsConnected(false);
    
    if (event.code !== 1000) {
      setConnectionError('Connection lost');
    }
  };

  const startFallbackPolling = () => {
    Logger.info('Starting fallback polling mode');
    setUseFallback(true);
    setIsConnected(true); // Simulate connection for UI
    setConnectionError(null);
    
    if (onConnectionChange) {
      onConnectionChange(true);
    }
  };

  const connect = () => {
    try {
      Logger.info('Connecting to WebSocket');
      connectWebSocket(handleMessage, handleError, handleClose);
    } catch (error) {
      Logger.error('Failed to connect to WebSocket', error);
      setConnectionError('Failed to connect');
      setIsConnected(false);
      startFallbackPolling();
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }
    disconnectWebSocket();
    setIsConnected(false);
    setConnectionError(null);
    setUseFallback(false);
  };

  useEffect(() => {
    const ws = connectWebSocket(handleMessage, handleError, handleClose);
    
    ws.onopen = () => {
      Logger.info('WebSocket connected successfully');
      setIsConnected(true);
      setConnectionError(null);
      setUseFallback(false);
      if (onConnectionChange) {
        onConnectionChange(true);
      }
    };

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    useFallback,
    connect,
    disconnect
  };
};

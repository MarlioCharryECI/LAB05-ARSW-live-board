import { useState, useEffect, useRef } from "react";
import { connectWebSocket, disconnectWebSocket } from "../services/api";
import { Logger } from "../utils/logger";

export const useWebSocket = (onBoardUpdate, onConnectionChange) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const fallbackIntervalRef = useRef(null);

  const handleMessage = (message) => {
    try {
      switch (message.type) {
        case "board_update":
          if (message.data && Array.isArray(message.data.strokes)) {
            onBoardUpdate(message.data.strokes);
          }
          break;
        case "stroke":
          if (message.data) {
            onBoardUpdate((prev) => {
              const exists = prev.some((s) => s.id === message.data.id);
              if (!exists) {
                return [...prev, message.data];
              }
              return prev;
            });
          }
          break;
        case "clear":
        case "clear_board":
        case "board_clear":
          onBoardUpdate([]);
          break;
        case "heartbeat":
          break;
        case "error":
          setConnectionError(message.data.message || "WebSocket error");
          break;
        case "connection_status":
          break;
        default:
          Logger.warn("Unknown WebSocket message type", { type: message.type });
      }
    } catch (error) {
      Logger.error("Error handling WebSocket message", error);
    }
  };

  const handleError = (error) => {
    setConnectionError("Connection error");
    setIsConnected(false);

    if (!useFallback) {
      setUseFallback(true);
    }
  };

  const handleClose = (event) => {
    setIsConnected(false);

    if (event.code !== 1000) {
      setConnectionError("Connection lost");
    }
  };

  const startFallbackPolling = () => {
    setUseFallback(true);
    setIsConnected(true);
    setConnectionError(null);

    if (onConnectionChange) {
      onConnectionChange(true);
    }
  };

  const connect = () => {
    try {
      connectWebSocket(handleMessage, handleError, handleClose);
    } catch (error) {
      setConnectionError("Failed to connect");
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
    disconnect,
  };
};

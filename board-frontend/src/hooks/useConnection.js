// hooks/useConnection.js
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { join } from "../services/api";
import { retryManager } from "../utils/retry";
import { Logger } from "../utils/logger";

export const useConnection = () => {
  const [userId, setUserId] = useState("");
  const [color, setColor] = useState("#000000");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const connect = useCallback(async () => {
    try {
      setConnectionError(null);
      setIsReconnecting(true);

      const uid = uuidv4();
      setUserId(uid);
      localStorage.setItem("userId", uid);

      Logger.info("Connecting user", { userId: uid });

      const response = await retryManager.executeWithRetry(() => join(uid), "user-join");

      setColor(response.color);
      setIsConnected(true);
      setConnectionError(null);

      Logger.info("User connected successfully", {
        userId: uid,
        color: response.color,
      });
    } catch (error) {
      Logger.error("Connection failed", error);
      setConnectionError(error.message);
      setIsConnected(false);
    } finally {
      setIsReconnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionError(null);
    localStorage.removeItem("userId");
    Logger.info("User disconnected");
  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  return {
    userId,
    color,
    isConnected,
    connectionError,
    isReconnecting,
    connect,
    disconnect,
  };
};

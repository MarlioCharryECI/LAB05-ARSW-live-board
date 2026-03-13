import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Board from "./components/Board";
import { join, sendStroke, clearBoard, getBoard, sendWebSocketMessage } from "./services/api";
import { useWebSocket } from "./hooks/useWebSocket";
import { retryManager } from "./utils/retry";
import { DataValidator } from "./utils/validation";
import { Logger } from "./utils/logger";

const App = () => {
  const [userId, setUserId] = useState("");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  const initializeUser = async () => {
    try {
      const uid = uuidv4();
      setUserId(uid);
      localStorage.setItem("userId", uid);

      const response = await retryManager.executeWithRetry(() => join(uid), "user-join");

      setColor(response.color);
      setBrushSize(4);
      setConnectionError(null);
    } catch (error) {
      Logger.error("Failed to initialize user", error);
      setConnectionError(error.message);
    }
  };

  useEffect(() => {
    initializeUser();
  }, []);

  const handleBoardUpdate = (newStrokesOrFn) => {
    setStrokes((prevStrokes) => {
      const newStrokes = typeof newStrokesOrFn === "function" 
        ? newStrokesOrFn(prevStrokes) 
        : newStrokesOrFn;
      
      return prevStrokes.length !== newStrokes.length || 
        JSON.stringify(prevStrokes.map(s => s.id).sort()) !== 
        JSON.stringify(newStrokes.map(s => s.id).sort())
        ? newStrokes 
        : prevStrokes;
    });
  };


  const {
    isConnected: wsConnected,
    connectionError: wsError,
    useFallback,
  } = useWebSocket(handleBoardUpdate);

  useEffect(() => {
    if (!wsConnected) return;

    const loadInitialBoard = async () => {
      try {
        const boardData = await retryManager.executeWithRetry(
          () => getBoard(),
          "initial-board-load"
        );

        if (Array.isArray(boardData)) {
          setStrokes(boardData);
        }
      } catch (error) {
        Logger.error("Error loading initial board", error);
        setConnectionError("Failed to load board");
      }
    };

    loadInitialBoard();

    if (useFallback) {
      const pollInterval = setInterval(async () => {
        try {
          const boardData = await getBoard();
          if (Array.isArray(boardData)) {
            handleBoardUpdate(boardData);
          }
        } catch (error) {
          Logger.error("Polling error", error);
        }
      }, 1000);

      return () => clearInterval(pollInterval);
    }
  }, [wsConnected, useFallback]);

  const handleStrokeEnd = async (rawStroke) => {
    try {
      const validation = DataValidator.validateStroke(rawStroke);

      if (!validation.isValid) {
        return;
      }

      const stroke = DataValidator.sanitizeStroke(rawStroke);

      setStrokes((prev) => {
        if (prev.some((s) => s.id === stroke.id)) {
          return prev;
        }
        return [...prev, stroke];
      });

      await retryManager.executeWithRetry(() => sendStroke(stroke), "send-stroke");
    } catch (error) {
      Logger.error("Error handling stroke", error);
    }
  };

  const handleClear = async () => {
    try {
      sendWebSocketMessage({ type: "clear" });

      await retryManager.executeWithRetry(() => clearBoard(), "clear-board");

      setStrokes([]);
    } catch (error) {
      Logger.error("Error clearing board", error);
    }
  };

  if (!wsConnected) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          padding: "20px"
        }}
      >
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          maxWidth: "400px",
          width: "100%"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎨</div>
          <h2 style={{
            margin: "0 0 10px 0",
            fontSize: "24px",
            fontWeight: "600",
            color: "#333"
          }}>
            Tablero Colaborativo
          </h2>
          <p style={{
            margin: "0 0 30px 0",
            color: "#666",
            fontSize: "16px"
          }}>
            {connectionError ? 
              "No pudimos conectar con el servidor" : 
              "Conectando al tablero..."
            }
          </p>
          
          {connectionError ? (
            <>
              <div style={{ 
                color: "#f44336", 
                marginBottom: "20px", 
                fontSize: "14px",
                padding: "10px",
                background: "rgba(244, 67, 54, 0.1)",
                borderRadius: "8px"
              }}>
                Error: {connectionError}
              </div>
              <button
                onClick={initializeUser}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                }}
              >
                Reintentar Conexión
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "20px",
                height: "20px",
                border: "3px solid #667eea",
                borderTop: "3px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              <span style={{ color: "#667eea", fontWeight: "500" }}>
                Estableciendo conexión...
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const predefinedColors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500",
    "#800080", "#FFC0CB", "#A52A2A", "#808080"
  ];

  return (
    <div style={{ 
      padding: "20px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <div>
            <h1 style={{ 
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Tablero Colaborativo
            </h1>
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              Dibuja en tiempo real con otros usuarios
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "10px",
              padding: "8px 12px",
              background: "rgba(102, 126, 234, 0.1)",
              borderRadius: "8px"
            }}>
              <span style={{ fontSize: "14px", fontWeight: "500" }}>Tu color:</span>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: color,
                  border: "2px solid #fff",
                  borderRadius: "50%",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  cursor: "pointer",
                  transition: "transform 0.2s"
                }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Cambiar color"
              />
              <span style={{ 
                fontSize: "12px", 
                color: "#666",
                fontFamily: "monospace"
              }}>
                {userId.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "15px",
          marginTop: "20px",
          paddingTop: "20px",
          borderTop: "1px solid rgba(0, 0, 0, 0.1)",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: "500" }}>Colores:</span>
            <div style={{ display: "flex", gap: "5px" }}>
              {predefinedColors.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: presetColor,
                    border: color === presetColor ? "3px solid #667eea" : "2px solid #ddd",
                    borderRadius: "50%",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: "500" }}>Grosor:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              style={{ width: "100px" }}
            />
            <span style={{ 
              fontSize: "12px", 
              background: "rgba(102, 126, 234, 0.1)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "500"
            }}>
              {brushSize}px
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
            <button
              onClick={handleClear}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(238, 90, 36, 0.3)"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(238, 90, 36, 0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(238, 90, 36, 0.3)";
              }}
            >
              Limpiar Tablero
            </button>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "15px",
          marginTop: "15px",
          fontSize: "13px"
        }}>
          {useFallback && (
            <span style={{ 
              color: "#ff9800", 
              background: "rgba(255, 152, 0, 0.1)",
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: "500"
            }}>
              Modo de respaldo activado
            </span>
          )}
          {connectionError && (
            <span style={{ 
              color: "#f44336", 
              background: "rgba(244, 67, 54, 0.1)",
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: "500"
            }}>
              Error de conexión
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Board 
          strokes={strokes} 
          onStrokeEnd={handleStrokeEnd} 
          color={color} 
          width={brushSize}
        />
        
        <div style={{ 
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "15px",
          padding: "10px",
          background: "rgba(102, 126, 234, 0.05)",
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          <span style={{ color: "#666", fontWeight: "500" }}>
            Usuarios conectados: {new Set(strokes.map((s) => s.userId)).size}
          </span>
          <span style={{ color: "#999", fontSize: "12px" }}>
            Trazos totales: {strokes.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;

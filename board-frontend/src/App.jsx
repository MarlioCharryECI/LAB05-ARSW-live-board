import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Board from './components/Board';
import { join, sendStroke, clearBoard, getBoard, sendWebSocketMessage } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { retryManager } from './utils/retry';
import { DataValidator } from './utils/validation';
import { Logger } from './utils/logger';

const App = () => {
  const [userId, setUserId] = useState('');
  const [color, setColor] = useState('#000000');
  const [strokes, setStrokes] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

    const initializeUser = async () => {
    try {
      const uid = uuidv4();
      setUserId(uid);
      localStorage.setItem('userId', uid);
      
      const response = await retryManager.executeWithRetry(
        () => join(uid),
        'user-join'
      );
      
      setColor(response.color);
      setConnectionError(null);
    } catch (error) {
      Logger.error('Failed to initialize user', error);
      setConnectionError(error.message);
    }
  };

  useEffect(() => {
    setTimeout(initializeUser, 0);
  }, []);

    const handleBoardUpdate = (newStrokesOrFn) => {
    setStrokes(prevStrokes => {
      let newStrokes;
      
      if (typeof newStrokesOrFn === 'function') {
        newStrokes = newStrokesOrFn(prevStrokes);
      } else {
        newStrokes = newStrokesOrFn;
      }
      
      if (prevStrokes.length !== newStrokes.length) {
        return newStrokes;
      }
      
      const prevIds = prevStrokes.map(s => s.id).sort();
      const newIds = newStrokes.map(s => s.id).sort();
      
      if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
        return newStrokes;
      }
      
      return prevStrokes;
    });
  };

  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
  };

  const { isConnected: wsConnected, connectionError: wsError, useFallback } = useWebSocket(
    handleBoardUpdate,
    handleConnectionChange
  );

    useEffect(() => {
    if (!wsConnected) return;

    const loadInitialBoard = async () => {
      try {
        const boardData = await retryManager.executeWithRetry(
          () => getBoard(),
          'initial-board-load'
        );
        
        if (Array.isArray(boardData)) {
          setStrokes(boardData);
        }
      } catch (error) {
        Logger.error('Error loading initial board', error);
        setConnectionError('Failed to load board');
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
          Logger.error('Polling error', error);
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
      
      setStrokes(prev => {
        if (prev.some(s => s.id === stroke.id)) {
          return prev;
        }
        return [...prev, stroke];
      });
      
      await retryManager.executeWithRetry(
        () => sendStroke(stroke),
        'send-stroke'
      );
      
    } catch (error) {
      Logger.error('Error handling stroke', error);
    }
  };

    const handleClear = async () => {
    try {
      sendWebSocketMessage({ type: 'clear' });
      
      await retryManager.executeWithRetry(
        () => clearBoard(),
        'clear-board'
      );
      
      setStrokes([]);
    } catch (error) {
      Logger.error('Error clearing board', error);
    }
  };

  if (!wsConnected) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        gap: '20px'
      }}>
        <div>
          {connectionError ? (
            <>
              <div style={{ color: '#ff4444', marginBottom: '10px' }}>
                Error de conexión: {connectionError}
              </div>
              <button 
                onClick={initializeUser}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reintentar Conexión
              </button>
            </>
          ) : (
            'Conectando al tablero...'
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <h2>Tablero Colaborativo</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Tu color:</span>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            backgroundColor: color, 
            border: '2px solid #333',
            borderRadius: '4px'
          }} />
          <span>({userId.substring(0, 8)}...)</span>
        </div>
        <button 
          onClick={handleClear}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Limpiar Tablero
        </button>
        {useFallback && (
          <span style={{ color: '#ff9800', fontSize: '14px' }}>
            Modo de respaldo activado
          </span>
        )}
        {connectionError && (
          <span style={{ color: '#ff4444', fontSize: '14px' }}>
            Error de conexión
          </span>
        )}
      </div>
      
      <Board 
        strokes={strokes} 
        onStrokeEnd={handleStrokeEnd} 
        color={color} 
      />
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Usuarios conectados: {new Set(strokes.map(s => s.userId)).size}
      </div>
    </div>
  );
};

export default App;
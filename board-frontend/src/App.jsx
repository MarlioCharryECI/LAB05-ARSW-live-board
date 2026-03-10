import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Board from './components/BoardFinal';
import { join, getBoard } from './services/api';

const App = () => {
  const [userId, setUserId] = useState('');
  const [color, setColor] = useState('#000000');
  const [strokes, setStrokes] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Debug: Log state changes
  useEffect(() => {
    console.log('State updated:', { userId, color, strokesLength: strokes.length, isConnected });
  }, [userId, color, strokes.length, isConnected]);

  // Inicialización del usuario
  useEffect(() => {
    const initializeUser = async () => {
      // Generar un ID único para cada sesión/tab, no persistir en localStorage
      const uid = uuidv4();
      setUserId(uid);

      try {
        const response = await join(uid);
        setColor(response.color);
        setIsConnected(true);
      } catch (error) {
        console.error('Error al unirse:', error);
      }
    };

    initializeUser();
  }, []);

  // Sincronización optimizada con el backend (mientras se configura WebSocket)
  useEffect(() => {
    if (!isConnected) return;

    const syncBoard = async () => {
      try {
        const boardData = await getBoard();
        // Solo actualizar si los datos han cambiado (comparación por longitud y IDs)
        setStrokes(prevStrokes => {
          if (prevStrokes.length !== boardData.length) {
            return boardData;
          }
          // Comparar IDs para detectar cambios
          const prevIds = prevStrokes.map(s => s.id).sort();
          const newIds = boardData.map(s => s.id).sort();
          if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
            return boardData;
          }
          return prevStrokes;
        });
      } catch (error) {
        console.error('Error sincronizando:', error);
      }
    };

    // Sincronización inicial
    syncBoard();

    // Activar polling para sincronización multi-usuario vía API
    const interval = setInterval(syncBoard, 500); // 500ms para sincronización rápida
    return () => clearInterval(interval);
  }, [isConnected]);

  const handleStrokeEnd = async (stroke) => {
    // Validate stroke before sending
    console.log('Stroke data being sent:', stroke);
    
    if (!stroke.id || !stroke.userId || !stroke.color || !stroke.points || stroke.points.length < 1) {
      console.error('Invalid stroke data:', stroke);
      return;
    }
    
    // Agregar localmente inmediatamente para mejor UX
    setStrokes(prev => {
      // Evitar duplicados
      if (prev.some(s => s.id === stroke.id)) {
        return prev;
      }
      console.log('Adding stroke to local state:', stroke.id);
      return [...prev, stroke];
    });
    
    // Enviar al backend en background (no bloquear)
    console.log('Sending stroke to backend:', stroke);
    import('./services/api').then(({ sendStroke }) => {
      return sendStroke(stroke);
    }).then(() => {
      console.log('Stroke sent successfully to backend:', stroke.id);
    }).catch(error => {
      console.error('Error enviando trazo al backend:', error);
      console.error('Stroke that failed:', stroke);
      // No remover el trazo local si falla el backend
    });
  };

  const handleClear = async () => {
    try {
      // Importar clearBoard dinámicamente
      const { clearBoard } = await import('./services/api');
      await clearBoard();
      
      // Limpiar localmente inmediatamente para mejor UX
      setStrokes([]);
    } catch (error) {
      console.error('Error limpiando tablero:', error);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Conectando al tablero...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
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
          <span>({userId})</span>
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
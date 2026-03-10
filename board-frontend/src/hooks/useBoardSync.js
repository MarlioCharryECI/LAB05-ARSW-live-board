// hooks/useBoardSync.js
import { useState, useEffect, useCallback } from 'react';
import { getBoard } from '../services/api';
import { retryManager } from '../utils/retry';
import { Logger } from '../utils/logger';

export const useBoardSync = (isConnected, onSyncError) => {
  const [strokes, setStrokes] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncBoard = useCallback(async () => {
    if (!isConnected || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const boardData = await retryManager.executeWithRetry(
        () => getBoard(),
        'board-sync'
      );
      
      if (!Array.isArray(boardData)) {
        Logger.warn('Invalid board data received', { type: typeof boardData });
        return;
      }
      
      setStrokes(prevStrokes => {
        const hasChanges = prevStrokes.length !== boardData.length || 
          JSON.stringify(prevStrokes.map(s => s.id).sort()) !== 
          JSON.stringify(boardData.map(s => s.id).sort());
          
        if (hasChanges) {
          Logger.debug('Board updated', { 
            old: prevStrokes.length, 
            new: boardData.length 
          });
          return boardData;
        }
        return prevStrokes;
      });
      
      setLastSyncTime(Date.now());
      onSyncError?.(null);
    } catch (error) {
      Logger.error('Error syncing board', error);
      onSyncError?.(error.message);
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, isSyncing, onSyncError]);

  useEffect(() => {
    if (!isConnected) return;

    syncBoard();
    const interval = setInterval(syncBoard, 100);
    return () => clearInterval(interval);
  }, [isConnected, syncBoard]);

  return { strokes, setStrokes, lastSyncTime, isSyncing };
};

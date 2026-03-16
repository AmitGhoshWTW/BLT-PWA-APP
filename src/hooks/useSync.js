// src/hooks/useSync.js

import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '../services/SyncManager';

/**
 * React hook for sync operations
 */
export function useSync(autoStart = false) {
  const [status, setStatus] = useState(syncManager.getStatus());
  const [lastEvent, setLastEvent] = useState(null);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Subscribe to sync events
    const unsubscribe = syncManager.addListener((event, data) => {
      setLastEvent({ event, data, timestamp: new Date() });
      setStatus(syncManager.getStatus());

      if (event === 'error') {
        setError(data);
      }

      if (event === 'active') {
        setIsSyncing(true);
      }

      if (event === 'paused' || event === 'complete') {
        setIsSyncing(false);
      }
    });

    // Auto-start if configured
    if (autoStart) {
      syncManager.startSync().catch(console.error);
    }

    return () => {
      unsubscribe();
    };
  }, [autoStart]);

  const startSync = useCallback(async () => {
    setError(null);
    await syncManager.startSync();
  }, []);

  const stopSync = useCallback(async () => {
    await syncManager.stopSync();
  }, []);

  const syncOnce = useCallback(async () => {
    setError(null);
    setIsSyncing(true);
    try {
      const result = await syncManager.syncOnce();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const push = useCallback(async () => {
    setError(null);
    return await syncManager.push();
  }, []);

  const pull = useCallback(async () => {
    setError(null);
    return await syncManager.pull();
  }, []);

  return {
    status,
    lastEvent,
    error,
    isSyncing,
    backend: status.backend,
    isActive: status.isActive,
    lastSync: status.lastSync,
    startSync,
    stopSync,
    syncOnce,
    push,
    pull
  };
}

export default useSync;
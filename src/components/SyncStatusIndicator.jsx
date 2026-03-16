// src/components/SyncStatusIndicator.jsx

import React from 'react';
import { useSync } from '../hooks/useSync';
import { Cloud, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Visual indicator showing sync status and backend type
 */
export function SyncStatusIndicator() {
  const { status, isSyncing, error, backend, lastSync, syncOnce } = useSync();

  const formatLastSync = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const getBackendIcon = () => {
    return backend === 'cosmosdb' ? (
      <Database className="w-4 h-4" />
    ) : (
      <Cloud className="w-4 h-4" />
    );
  };

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (isSyncing) return 'text-blue-500';
    if (status.isActive) return 'text-green-500';
    return 'text-gray-500';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
      {/* Backend indicator */}
      <div className="flex items-center gap-1 text-gray-600">
        {getBackendIcon()}
        <span className="font-medium capitalize">{backend}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-300" />

      {/* Sync status */}
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {isSyncing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : error ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        <span>{formatLastSync(lastSync)}</span>
      </div>

      {/* Manual sync button */}
      <button
        onClick={syncOnce}
        disabled={isSyncing}
        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
        title="Sync now"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

export default SyncStatusIndicator;
// src/services/syncManager.js
import PouchDB from "pouchdb-browser";
import { localDB } from "./pouchdbService";
import eventBus from "../utils/eventBus";

// Module-level variables
let remoteDB = null;
let syncHandler = null;
let REMOTE_URL = null;
let COUCHDB_USER = null;
let COUCHDB_PASSWORD = null;

/**
 * Configure remote database with credentials
 */
export function configureRemote(url, username, password) {
  COUCHDB_USER = username;
  COUCHDB_PASSWORD = password;
  REMOTE_URL = url;

  // Custom fetch with CORS and auth
  const customFetch = (fetchUrl, opts) => {
    opts = opts || {};
    opts.mode = 'cors';
    opts.credentials = 'include';
    
    if (!opts.headers) {
      opts.headers = {};
    }
    
    const auth = btoa(`${username}:${password}`);
    opts.headers['Authorization'] = `Basic ${auth}`;
    opts.headers['Content-Type'] = 'application/json';
    opts.headers['Accept'] = 'application/json';
    
    return fetch(fetchUrl, opts);
  };

  remoteDB = new PouchDB(url, {
    skip_setup: false,
    fetch: customFetch
  });

  return remoteDB;
}

/**
 * Test remote connection
 */
export async function testRemoteConnection() {
  if (!remoteDB) {
    console.error("[syncManager] Remote DB not configured");
    return false;
  }

  try {
    const info = await remoteDB.info();
    console.log("[syncManager] ✅ Remote connected:", info.db_name);
    return true;
  } catch (error) {
    console.error("[syncManager] ❌ Remote connection failed:", error.message);
    return false;
  }
}

/**
 * Start live bidirectional sync
 */
export function startSync() {
  if (!remoteDB) {
    console.error("[syncManager] Cannot start sync - remote DB not configured");
    return null;
  }

  if (syncHandler) {
    console.log("[syncManager] Sync already running");
    return syncHandler;
  }

  console.log("[syncManager] Starting live sync...");

  syncHandler = localDB.sync(remoteDB, {
    live: true,
    retry: true,
    heartbeat: 10000,
    timeout: 60000,
    batch_size: 100,
    batches_limit: 10
  })
  .on('change', (info) => {
    if (info.change?.docs && info.change.docs.length > 0) {
      console.log(`[syncManager] 🔄 Synced ${info.change.docs.length} docs (${info.direction})`);
      
      // Check if there are reports or screenshots
      const hasReports = info.change.docs.some(doc => doc._id?.startsWith('report:'));
      const hasScreenshots = info.change.docs.some(doc => doc._id?.startsWith('screenshot:'));
      
      if (hasReports || hasScreenshots) {
        console.log('[syncManager] 📢 Data changed, notifying components...');
        
        // Emit event to notify UI components
        eventBus.emit('data-synced', {
          direction: info.direction,
          docCount: info.change.docs.length,
          hasReports,
          hasScreenshots
        });
      }
    }
  })
  .on('paused', (err) => {
    if (err) {
      console.warn('[syncManager] ⚠️ Sync paused with error:', err);
    }
  })
  .on('active', () => {
    console.log('[syncManager] 🔄 Sync active');
  })
  .on('error', (err) => {
    console.error('[syncManager] ❌ Sync error:', err);
  });

  return syncHandler;
}

/**
 * Stop sync
 */
export function stopSync() {
  if (syncHandler) {
    syncHandler.cancel();
    syncHandler = null;
    console.log("[syncManager] Sync stopped");
  }
}

/**
 * Sync once (not live)
 */
export async function syncOnce() {
  if (!remoteDB) {
    throw new Error("Remote DB not configured");
  }

  console.log("[syncManager] Syncing once...");
  
  const result = await localDB.sync(remoteDB, {
    retry: false
  });

  console.log("[syncManager] Sync complete");
  return result;
}

/**
 * Get sync status
 */
export function getSyncStatus() {
  return {
    isActive: !!syncHandler,
    remoteUrl: REMOTE_URL
  };
}

/**
 * Get remote DB instance
 */
export function getRemoteDB() {
  return remoteDB;
}

/**
 * Get local DB instance
 */
export function getLocalDB() {
  return localDB;
}

/**
 * Get sync handler
 */
export function getSyncHandler() {
  return syncHandler;
}

/**
 * Get remote URL
 */
export function getRemoteUrl() {
  return REMOTE_URL;
}
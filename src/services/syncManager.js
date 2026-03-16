// // // src/services/syncManager.js
// // import PouchDB from "pouchdb-browser";
// // import { localDB } from "./pouchdbService";
// // import eventBus from "../utils/eventBus";

// // // Module-level variables
// // let remoteDB = null;
// // let syncHandler = null;
// // let REMOTE_URL = null;
// // let COUCHDB_USER = null;
// // let COUCHDB_PASSWORD = null;

// // /**
// //  * Configure remote database with credentials
// //  */
// // export function configureRemote(url, username, password) {
// //   COUCHDB_USER = username;
// //   COUCHDB_PASSWORD = password;
// //   REMOTE_URL = url;

// //   // Custom fetch with CORS and auth
// //   const customFetch = (fetchUrl, opts) => {
// //     opts = opts || {};
// //     opts.mode = 'cors';
// //     opts.credentials = 'include';
    
// //     if (!opts.headers) {
// //       opts.headers = {};
// //     }
    
// //     const auth = btoa(`${username}:${password}`);
// //     opts.headers['Authorization'] = `Basic ${auth}`;
// //     opts.headers['Content-Type'] = 'application/json';
// //     opts.headers['Accept'] = 'application/json';
    
// //     return fetch(fetchUrl, opts);
// //   };

// //   remoteDB = new PouchDB(url, {
// //     skip_setup: false,
// //     fetch: customFetch
// //   });

// //   return remoteDB;
// // }

// // /**
// //  * Test remote connection
// //  */
// // export async function testRemoteConnection() {
// //   if (!remoteDB) {
// //     console.error("[syncManager] Remote DB not configured");
// //     return false;
// //   }

// //   try {
// //     const info = await remoteDB.info();
// //     console.log("[syncManager] ✅ Remote connected:", info.db_name);
// //     return true;
// //   } catch (error) {
// //     console.error("[syncManager] ❌ Remote connection failed:", error.message);
// //     return false;
// //   }
// // }

// // /**
// //  * Start live bidirectional sync
// //  */
// // export function startSync() {
// //   if (!remoteDB) {
// //     console.error("[syncManager] Cannot start sync - remote DB not configured");
// //     return null;
// //   }

// //   if (syncHandler) {
// //     console.log("[syncManager] Sync already running");
// //     return syncHandler;
// //   }

// //   console.log("[syncManager] Starting live sync...");

// //   syncHandler = localDB.sync(remoteDB, {
// //     live: true,
// //     retry: true,
// //     heartbeat: 10000,
// //     timeout: 60000,
// //     batch_size: 100,
// //     batches_limit: 10
// //   })
// //   .on('change', (info) => {
// //     if (info.change?.docs && info.change.docs.length > 0) {
// //       console.log(`[syncManager] 🔄 Synced ${info.change.docs.length} docs (${info.direction})`);
      
// //       // Check if there are reports or screenshots
// //       const hasReports = info.change.docs.some(doc => doc._id?.startsWith('report:'));
// //       const hasScreenshots = info.change.docs.some(doc => doc._id?.startsWith('screenshot:'));
      
// //       if (hasReports || hasScreenshots) {
// //         console.log('[syncManager] 📢 Data changed, notifying components...');
        
// //         // Emit event to notify UI components
// //         eventBus.emit('data-synced', {
// //           direction: info.direction,
// //           docCount: info.change.docs.length,
// //           hasReports,
// //           hasScreenshots
// //         });
// //       }
// //     }
// //   })
// //   .on('paused', (err) => {
// //     if (err) {
// //       console.warn('[syncManager] ⚠️ Sync paused with error:', err);
// //     }
// //   })
// //   .on('active', () => {
// //     console.log('[syncManager] 🔄 Sync active');
// //   })
// //   .on('error', (err) => {
// //     console.error('[syncManager] ❌ Sync error:', err);
// //   });

// //   return syncHandler;
// // }

// // /**
// //  * Stop sync
// //  */
// // export function stopSync() {
// //   if (syncHandler) {
// //     syncHandler.cancel();
// //     syncHandler = null;
// //     console.log("[syncManager] Sync stopped");
// //   }
// // }

// // /**
// //  * Sync once (not live)
// //  */
// // export async function syncOnce() {
// //   if (!remoteDB) {
// //     throw new Error("Remote DB not configured");
// //   }

// //   console.log("[syncManager] Syncing once...");
  
// //   const result = await localDB.sync(remoteDB, {
// //     retry: false
// //   });

// //   console.log("[syncManager] Sync complete");
// //   return result;
// // }

// // /**
// //  * Get sync status
// //  */
// // export function getSyncStatus() {
// //   return {
// //     isActive: !!syncHandler,
// //     remoteUrl: REMOTE_URL
// //   };
// // }

// // /**
// //  * Get remote DB instance
// //  */
// // export function getRemoteDB() {
// //   return remoteDB;
// // }

// // /**
// //  * Get local DB instance
// //  */
// // export function getLocalDB() {
// //   return localDB;
// // }

// // /**
// //  * Get sync handler
// //  */
// // export function getSyncHandler() {
// //   return syncHandler;
// // }

// // /**
// //  * Get remote URL
// //  */
// // export function getRemoteUrl() {
// //   return REMOTE_URL;
// // }

// // src/services/syncManager.js
// // Updated with dual backend support (CouchDB / Cosmos DB)

// import PouchDB from "pouchdb-browser";
// import { localDB } from "./pouchdbService";
// import eventBus from "../utils/eventBus";

// // =====================================================
// // BACKEND CONFIGURATION
// // =====================================================

// export const DatabaseBackend = {
//   COUCHDB: 'couchdb',
//   COSMOSDB: 'cosmosdb'
// };

// // Get backend from environment variable (default: couchdb)
// const SYNC_BACKEND = import.meta.env.VITE_SYNC_BACKEND || DatabaseBackend.COUCHDB;

// // CouchDB config from env
// const COUCHDB_CONFIG = {
//   url: import.meta.env.VITE_COUCHDB_URL || '',
//   database: import.meta.env.VITE_COUCHDB_DATABASE || 'blt_reports',
//   username: import.meta.env.VITE_COUCHDB_USERNAME || '',
//   password: import.meta.env.VITE_COUCHDB_PASSWORD || ''
// };

// // Cosmos DB config from env
// const COSMOSDB_CONFIG = {
//   endpoint: import.meta.env.VITE_COSMOSDB_ENDPOINT || '',
//   key: import.meta.env.VITE_COSMOSDB_KEY || '',
//   database: import.meta.env.VITE_COSMOSDB_DATABASE || 'blt',
//   container: import.meta.env.VITE_COSMOSDB_CONTAINER || 'reports'
// };

// // =====================================================
// // MODULE STATE
// // =====================================================

// let remoteDB = null;
// let syncHandler = null;
// let localChangesHandler = null;
// let cosmosPollingInterval = null;
// let lastSyncTime = null;

// // Legacy variables (for backward compatibility)
// let REMOTE_URL = null;
// let COUCHDB_USER = null;
// let COUCHDB_PASSWORD = null;

// // =====================================================
// // BACKEND DETECTION
// // =====================================================

// /**
//  * Get current backend type
//  */
// export function getBackendType() {
//   return SYNC_BACKEND;
// }

// /**
//  * Check if using CouchDB
//  */
// export function isCouchDB() {
//   return SYNC_BACKEND === DatabaseBackend.COUCHDB;
// }

// /**
//  * Check if using Cosmos DB
//  */
// export function isCosmosDB() {
//   return SYNC_BACKEND === DatabaseBackend.COSMOSDB;
// }

// /**
//  * Get backend display name
//  */
// export function getBackendDisplayName() {
//   return isCouchDB() ? 'CouchDB' : 'Cosmos DB';
// }

// // =====================================================
// // COUCHDB FUNCTIONS (EXISTING - PRESERVED)
// // =====================================================

// /**
//  * Configure remote database with credentials (CouchDB)
//  * This is the existing function - kept for backward compatibility
//  */
// export function configureRemote(url, username, password) {
//   COUCHDB_USER = username;
//   COUCHDB_PASSWORD = password;
//   REMOTE_URL = url;

//   // Custom fetch with CORS and auth
//   const customFetch = (fetchUrl, opts) => {
//     opts = opts || {};
//     opts.mode = 'cors';
//     opts.credentials = 'include';
    
//     if (!opts.headers) {
//       opts.headers = {};
//     }
    
//     const auth = btoa(`${username}:${password}`);
//     opts.headers['Authorization'] = `Basic ${auth}`;
//     opts.headers['Content-Type'] = 'application/json';
//     opts.headers['Accept'] = 'application/json';
    
//     return fetch(fetchUrl, opts);
//   };

//   remoteDB = new PouchDB(url, {
//     skip_setup: false,
//     fetch: customFetch
//   });

//   console.log("[syncManager] CouchDB remote configured:", url.replace(/\/\/.*@/, '//***@'));
//   return remoteDB;
// }

// /**
//  * Test remote connection
//  */
// export async function testRemoteConnection() {
//   if (isCouchDB()) {
//     return testCouchDBConnection();
//   } else if (isCosmosDB()) {
//     return testCosmosDBConnection();
//   }
//   return false;
// }

// async function testCouchDBConnection() {
//   if (!remoteDB) {
//     console.error("[syncManager] Remote DB not configured");
//     return false;
//   }

//   try {
//     const info = await remoteDB.info();
//     console.log("[syncManager] ✅ CouchDB connected:", info.db_name);
//     return true;
//   } catch (error) {
//     console.error("[syncManager] ❌ CouchDB connection failed:", error.message);
//     return false;
//   }
// }

// // =====================================================
// // COSMOS DB FUNCTIONS (NEW)
// // =====================================================

// async function testCosmosDBConnection() {
//   const { endpoint, key, database, container } = COSMOSDB_CONFIG;
  
//   if (!endpoint || !key) {
//     console.error("[syncManager] Cosmos DB not configured");
//     return false;
//   }

//   try {
//     const url = `${endpoint}dbs/${database}/colls/${container}`;
//     const date = new Date().toUTCString();
//     const resourceLink = `dbs/${database}/colls/${container}`;
    
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'x-ms-date': date,
//         'x-ms-version': '2018-12-31',
//         'Authorization': await generateCosmosAuthToken('GET', 'colls', resourceLink, date, key)
//       }
//     });

//     if (response.ok) {
//       console.log("[syncManager] ✅ Cosmos DB connected");
//       return true;
//     } else {
//       throw new Error(`HTTP ${response.status}`);
//     }
//   } catch (error) {
//     console.error("[syncManager] ❌ Cosmos DB connection failed:", error.message);
//     return false;
//   }
// }

// /**
//  * Generate Cosmos DB master key authorization token
//  */
// async function generateCosmosAuthToken(verb, resourceType, resourceLink, date, masterKey) {
//   try {
//     const keyBytes = Uint8Array.from(atob(masterKey), c => c.charCodeAt(0));
//     const key = await crypto.subtle.importKey(
//       'raw',
//       keyBytes,
//       { name: 'HMAC', hash: 'SHA-256' },
//       false,
//       ['sign']
//     );
    
//     const text = `${verb.toLowerCase()}\n${resourceType.toLowerCase()}\n${resourceLink}\n${date.toLowerCase()}\n\n`;
//     const encoder = new TextEncoder();
//     const data = encoder.encode(text);
    
//     const signature = await crypto.subtle.sign('HMAC', key, data);
//     const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
//     return encodeURIComponent(`type=master&ver=1.0&sig=${base64Signature}`);
//   } catch (error) {
//     console.error("[syncManager] Auth token generation failed:", error);
//     throw error;
//   }
// }

// /**
//  * Execute Cosmos DB REST request
//  */
// async function cosmosRequest(method, path, body = null, additionalHeaders = {}) {
//   const { endpoint, key, database, container } = COSMOSDB_CONFIG;
//   const url = `${endpoint}dbs/${database}/colls/${container}${path}`;
//   const date = new Date().toUTCString();
//   const resourceLink = `dbs/${database}/colls/${container}`;

//   const headers = {
//     'x-ms-date': date,
//     'x-ms-version': '2018-12-31',
//     'Content-Type': 'application/json',
//     'Authorization': await generateCosmosAuthToken(method, 'docs', resourceLink, date, key),
//     ...additionalHeaders
//   };

//   const options = {
//     method,
//     headers,
//     body: body ? JSON.stringify(body) : null
//   };

//   const response = await fetch(url, options);
  
//   if (!response.ok) {
//     const errorBody = await response.text();
//     throw new Error(`Cosmos DB error ${response.status}: ${errorBody}`);
//   }
  
//   const contentType = response.headers.get('content-type');
//   if (contentType && contentType.includes('application/json')) {
//     return await response.json();
//   }
//   return null;
// }

// /**
//  * Transform PouchDB document to Cosmos DB format
//  */
// function toCosmosFormat(doc) {
//   const cosmosDoc = {
//     id: doc._id.replace(/[/#?\\]/g, '_'),
//     _pouchId: doc._id,
//     _pouchRev: doc._rev,
//     ...doc,
//     category: doc.category || 'default',
//     _ts: Math.floor(Date.now() / 1000)
//   };
  
//   delete cosmosDoc._id;
//   delete cosmosDoc._rev;
  
//   return cosmosDoc;
// }

// /**
//  * Transform Cosmos DB document to PouchDB format
//  */
// function toPouchFormat(doc) {
//   const pouchDoc = {
//     _id: doc._pouchId || doc.id,
//     _rev: doc._pouchRev || `1-${doc._etag?.replace(/"/g, '') || Date.now()}`,
//     ...doc
//   };
  
//   delete pouchDoc.id;
//   delete pouchDoc._pouchId;
//   delete pouchDoc._pouchRev;
//   delete pouchDoc._rid;
//   delete pouchDoc._self;
//   delete pouchDoc._etag;
//   delete pouchDoc._ts;
  
//   return pouchDoc;
// }

// /**
//  * Push a single document to Cosmos DB
//  */
// // async function pushDocumentToCosmosDB(doc) {
// //   if (!doc || doc._id.startsWith('_design/')) return;

// //   const cosmosId = doc._id.replace(/[/#?\\]/g, '_');

// //   if (doc._deleted) {
// //     try {
// //       await cosmosRequest('DELETE', `/docs/${cosmosId}`);
// //       console.log('[syncManager] Cosmos: Deleted', doc._id);
// //     } catch (error) {
// //       if (!error.message.includes('404')) throw error;
// //     }
// //   } else {
// //     const cosmosDoc = toCosmosFormat(doc);
// //     await cosmosRequest('POST', '/docs', cosmosDoc, {
// //       'x-ms-documentdb-is-upsert': 'True',
// //       'x-ms-documentdb-partitionkey': `["${cosmosDoc.category}"]`
// //     });
// //     console.log('[syncManager] Cosmos: Upserted', doc._id);
// //   }
// // }

// async function pushDocumentToCosmosDB(doc) {
//   if (!doc || doc._id.startsWith('_design/')) return;

//   const cosmosId = doc._id.replace(/[/#?\\]/g, '_');

//   if (doc._deleted) {
//     try {
//       await cosmosRequest('DELETE', `/docs/${cosmosId}`, null, {
//         'x-ms-documentdb-partitionkey': `["${cosmosId}"]`  // Use id as partition
//       });
//       console.log('[syncManager] Cosmos: Deleted', doc._id);
//     } catch (error) {
//       if (!error.message.includes('404')) throw error;
//     }
//   } else {
//     const cosmosDoc = toCosmosFormat(doc);
//     await cosmosRequest('POST', '/docs', cosmosDoc, {
//       'x-ms-documentdb-is-upsert': 'True',
//       'x-ms-documentdb-partitionkey': `["${cosmosDoc.id}"]`  // Use id as partition
//     });
//     console.log('[syncManager] Cosmos: Upserted', doc._id);
//   }
// }

// /**
//  * Push all local documents to Cosmos DB
//  */
// async function pushToCosmosDB() {
//   try {
//     const localDocs = await localDB.allDocs({
//       include_docs: true,
//       attachments: true
//     });

//     let pushCount = 0;
//     for (const row of localDocs.rows) {
//       if (row.doc && !row.id.startsWith('_design/')) {
//         try {
//           await pushDocumentToCosmosDB(row.doc);
//           pushCount++;
//         } catch (error) {
//           console.error('[syncManager] Cosmos push failed:', row.id, error.message);
//         }
//       }
//     }

//     console.log('[syncManager] Cosmos: Pushed', pushCount, 'docs');
//     return pushCount;
//   } catch (error) {
//     console.error('[syncManager] Cosmos push failed:', error);
//     throw error;
//   }
// }

// /**
//  * Pull documents from Cosmos DB
//  */
// async function pullFromCosmosDB() {
//   try {
//     const lastTs = lastSyncTime ? Math.floor(lastSyncTime.getTime() / 1000) : 0;
    
//     const queryBody = {
//       query: 'SELECT * FROM c WHERE c._ts > @lastSync',
//       parameters: [{ name: '@lastSync', value: lastTs }]
//     };

//     const result = await cosmosRequest('POST', '/docs', queryBody, {
//       'x-ms-documentdb-isquery': 'True',
//       'x-ms-documentdb-query-enablecrosspartition': 'True',
//       'Content-Type': 'application/query+json'
//     });

//     let pullCount = 0;
//     let hasReports = false;
//     let hasScreenshots = false;

//     if (result && result.Documents) {
//       for (const cosmosDoc of result.Documents) {
//         try {
//           const pouchDoc = toPouchFormat(cosmosDoc);
          
//           // Check for existing document
//           let existingDoc;
//           try {
//             existingDoc = await localDB.get(pouchDoc._id);
//             pouchDoc._rev = existingDoc._rev;
//           } catch (e) {
//             delete pouchDoc._rev;
//           }

//           await localDB.put(pouchDoc);
//           pullCount++;

//           if (pouchDoc._id.startsWith('report:')) hasReports = true;
//           if (pouchDoc._id.startsWith('screenshot:')) hasScreenshots = true;
//         } catch (error) {
//           if (error.status !== 409) {
//             console.error('[syncManager] Cosmos pull doc failed:', cosmosDoc.id, error.message);
//           }
//         }
//       }

//       if (pullCount > 0) {
//         console.log('[syncManager] Cosmos: Pulled', pullCount, 'docs');
        
//         eventBus.emit('data-synced', {
//           direction: 'pull',
//           docCount: pullCount,
//           hasReports,
//           hasScreenshots,
//           backend: 'cosmosdb'
//         });
//       }
//     }

//     lastSyncTime = new Date();
//     return pullCount;
//   } catch (error) {
//     console.error('[syncManager] Cosmos pull failed:', error);
//     throw error;
//   }
// }

// /**
//  * Full Cosmos DB sync (push + pull)
//  */
// async function syncCosmosDB() {
//   await pushToCosmosDB();
//   await pullFromCosmosDB();
//   lastSyncTime = new Date();
// }

// // =====================================================
// // UNIFIED SYNC FUNCTIONS
// // =====================================================

// /**
//  * Initialize sync based on environment configuration
//  */
// export function initializeFromEnv() {
//   console.log("[syncManager] Initializing with backend:", SYNC_BACKEND);

//   if (isCouchDB()) {
//     const { url, username, password, database } = COUCHDB_CONFIG;
//     if (url) {
//       const fullUrl = username && password
//         ? `${url.replace('://', `://${username}:${password}@`)}/${database}`
//         : `${url}/${database}`;
//       configureRemote(fullUrl, username, password);
//     }
//   } else if (isCosmosDB()) {
//     console.log("[syncManager] Cosmos DB backend - using REST sync");
//   }

//   return SYNC_BACKEND;
// }

// /**
//  * Start live bidirectional sync
//  */
// export function startSync() {
//   if (isCouchDB()) {
//     return startCouchDBSync();
//   } else if (isCosmosDB()) {
//     return startCosmosDBSync();
//   }
  
//   console.error("[syncManager] Unknown backend:", SYNC_BACKEND);
//   return null;
// }

// /**
//  * Start CouchDB sync (existing logic preserved)
//  */
// function startCouchDBSync() {
//   if (!remoteDB) {
//     console.error("[syncManager] Cannot start sync - remote DB not configured");
//     return null;
//   }

//   if (syncHandler) {
//     console.log("[syncManager] Sync already running");
//     return syncHandler;
//   }

//   console.log("[syncManager] Starting CouchDB live sync...");

//   syncHandler = localDB.sync(remoteDB, {
//     live: true,
//     retry: true,
//     heartbeat: 10000,
//     timeout: 60000,
//     batch_size: 100,
//     batches_limit: 10
//   })
//   .on('change', (info) => {
//     if (info.change?.docs && info.change.docs.length > 0) {
//       console.log(`[syncManager] 🔄 Synced ${info.change.docs.length} docs (${info.direction})`);
//       lastSyncTime = new Date();
      
//       // Check if there are reports or screenshots
//       const hasReports = info.change.docs.some(doc => doc._id?.startsWith('report:'));
//       const hasScreenshots = info.change.docs.some(doc => doc._id?.startsWith('screenshot:'));
      
//       if (hasReports || hasScreenshots) {
//         console.log('[syncManager] 📢 Data changed, notifying components...');
        
//         // Emit event to notify UI components
//         eventBus.emit('data-synced', {
//           direction: info.direction,
//           docCount: info.change.docs.length,
//           hasReports,
//           hasScreenshots,
//           backend: 'couchdb'
//         });
//       }
//     }
//   })
//   .on('paused', (err) => {
//     if (err) {
//       console.warn('[syncManager] ⚠️ Sync paused with error:', err);
//     }
//   })
//   .on('active', () => {
//     console.log('[syncManager] 🔄 Sync active');
//   })
//   .on('error', (err) => {
//     console.error('[syncManager] ❌ Sync error:', err);
//   });

//   return syncHandler;
// }

// /**
//  * Start Cosmos DB sync
//  */
// function startCosmosDBSync() {
//   if (cosmosPollingInterval) {
//     console.log("[syncManager] Cosmos DB sync already running");
//     return cosmosPollingInterval;
//   }

//   console.log("[syncManager] Starting Cosmos DB sync...");

//   // Initial sync
//   syncCosmosDB().catch(console.error);

//   // Poll for changes every 10 seconds
//   const pollInterval = 10000;
//   cosmosPollingInterval = setInterval(async () => {
//     try {
//       await pullFromCosmosDB();
//     } catch (error) {
//       console.error("[syncManager] Cosmos DB poll error:", error);
//     }
//   }, pollInterval);

//   // Watch local changes and push immediately
//   localChangesHandler = localDB.changes({
//     since: 'now',
//     live: true,
//     include_docs: true
//   }).on('change', async (change) => {
//     if (change.doc && !change.doc._id.startsWith('_design/')) {
//       try {
//         await pushDocumentToCosmosDB(change.doc);
        
//         eventBus.emit('data-synced', {
//           direction: 'push',
//           docCount: 1,
//           hasReports: change.doc._id.startsWith('report:'),
//           hasScreenshots: change.doc._id.startsWith('screenshot:'),
//           backend: 'cosmosdb'
//         });
//       } catch (error) {
//         console.error("[syncManager] Push to Cosmos failed:", error);
//       }
//     }
//   });

//   return cosmosPollingInterval;
// }

// /**
//  * Stop sync
//  */
// export function stopSync() {
//   // Stop CouchDB sync
//   if (syncHandler) {
//     syncHandler.cancel();
//     syncHandler = null;
//     console.log("[syncManager] CouchDB sync stopped");
//   }

//   // Stop Cosmos DB polling
//   if (cosmosPollingInterval) {
//     clearInterval(cosmosPollingInterval);
//     cosmosPollingInterval = null;
//     console.log("[syncManager] Cosmos DB polling stopped");
//   }

//   // Stop local changes handler
//   if (localChangesHandler) {
//     localChangesHandler.cancel();
//     localChangesHandler = null;
//     console.log("[syncManager] Local changes handler stopped");
//   }
// }

// /**
//  * Sync once (not live)
//  */
// export async function syncOnce() {
//   if (isCouchDB()) {
//     if (!remoteDB) {
//       throw new Error("Remote DB not configured");
//     }

//     console.log("[syncManager] CouchDB syncing once...");
//     const result = await localDB.sync(remoteDB, { retry: false });
//     lastSyncTime = new Date();
//     console.log("[syncManager] Sync complete");
//     return result;
//   } else if (isCosmosDB()) {
//     console.log("[syncManager] Cosmos DB syncing once...");
//     await syncCosmosDB();
//     console.log("[syncManager] Sync complete");
//     return { pushed: true, pulled: true };
//   }

//   throw new Error("Unknown backend");
// }

// // =====================================================
// // STATUS & GETTERS (EXISTING - ENHANCED)
// // =====================================================

// /**
//  * Get sync status
//  */
// export function getSyncStatus() {
//   const backend = SYNC_BACKEND;
//   const isActive = isCouchDB() ? !!syncHandler : !!cosmosPollingInterval;

//   return {
//     status: isActive ? 'active' : 'idle',
//     isActive,
//     backend,
//     backendDisplayName: getBackendDisplayName(),
//     remoteUrl: isCouchDB() ? REMOTE_URL : COSMOSDB_CONFIG.endpoint,
//     lastSync: lastSyncTime
//   };
// }

// /**
//  * Get remote DB instance (CouchDB only)
//  */
// export function getRemoteDB() {
//   return remoteDB;
// }

// /**
//  * Get local DB instance
//  */
// export function getLocalDB() {
//   return localDB;
// }

// /**
//  * Get sync handler (CouchDB only)
//  */
// export function getSyncHandler() {
//   return syncHandler;
// }

// /**
//  * Get remote URL
//  */
// export function getRemoteUrl() {
//   return isCouchDB() ? REMOTE_URL : COSMOSDB_CONFIG.endpoint;
// }

// /**
//  * Get last sync time
//  */
// export function getLastSyncTime() {
//   return lastSyncTime;
// }

// // =====================================================
// // AUTO-INITIALIZATION
// // =====================================================

// // Auto-initialize from env if configured
// if (COUCHDB_CONFIG.url || COSMOSDB_CONFIG.endpoint) {
//   console.log("[syncManager] Auto-initializing from environment...");
//   initializeFromEnv();
// }

// src/services/syncManager.js
// Updated with dual backend support (CouchDB / Cosmos DB) + Azure Blob Storage for attachments

import PouchDB from "pouchdb-browser";
import { localDB } from "./pouchdbService";
import eventBus from "../utils/eventBus";

// =====================================================
// BACKEND CONFIGURATION
// =====================================================

export const DatabaseBackend = {
  COUCHDB: 'couchdb',
  COSMOSDB: 'cosmosdb'
};

// Get backend from environment variable (default: couchdb)
const SYNC_BACKEND = import.meta.env.VITE_SYNC_BACKEND || DatabaseBackend.COUCHDB;

// CouchDB config from env
const COUCHDB_CONFIG = {
  url: import.meta.env.VITE_COUCHDB_URL || '',
  database: import.meta.env.VITE_COUCHDB_DATABASE || 'blt_reports',
  username: import.meta.env.VITE_COUCHDB_USERNAME || '',
  password: import.meta.env.VITE_COUCHDB_PASSWORD || ''
};

// Cosmos DB config from env
const COSMOSDB_CONFIG = {
  endpoint: import.meta.env.VITE_COSMOSDB_ENDPOINT || '',
  key: import.meta.env.VITE_COSMOSDB_KEY || '',
  database: import.meta.env.VITE_COSMOSDB_DATABASE || 'blt',
  container: import.meta.env.VITE_COSMOSDB_CONTAINER || 'reports'
};

// Azure Blob Storage config from env
const BLOB_STORAGE_CONFIG = {
  accountName: import.meta.env.VITE_BLOB_ACCOUNT_NAME || '',
  sasToken: import.meta.env.VITE_BLOB_SAS_TOKEN || '',
  containerName: import.meta.env.VITE_BLOB_CONTAINER_NAME || 'blt-attachments'
};

// =====================================================
// MODULE STATE
// =====================================================

let remoteDB = null;
let syncHandler = null;
let localChangesHandler = null;
let cosmosPollingInterval = null;
let lastSyncTime = null;

// Legacy variables (for backward compatibility)
let REMOTE_URL = null;
let COUCHDB_USER = null;
let COUCHDB_PASSWORD = null;

// =====================================================
// BACKEND DETECTION
// =====================================================

/**
 * Get current backend type
 */
export function getBackendType() {
  return SYNC_BACKEND;
}

/**
 * Check if using CouchDB
 */
export function isCouchDB() {
  return SYNC_BACKEND === DatabaseBackend.COUCHDB;
}

/**
 * Check if using Cosmos DB
 */
export function isCosmosDB() {
  return SYNC_BACKEND === DatabaseBackend.COSMOSDB;
}

/**
 * Get backend display name
 */
export function getBackendDisplayName() {
  return isCouchDB() ? 'CouchDB' : 'Cosmos DB';
}

/**
 * Check if Blob Storage is configured
 */
export function isBlobStorageConfigured() {
  return !!(BLOB_STORAGE_CONFIG.accountName && BLOB_STORAGE_CONFIG.sasToken);
}

// =====================================================
// AZURE BLOB STORAGE FUNCTIONS
// =====================================================

/**
 * Get Blob Storage base URL
 */
function getBlobBaseUrl() {
  const { accountName, containerName } = BLOB_STORAGE_CONFIG;
  return `https://${accountName}.blob.core.windows.net/${containerName}`;
}

/**
 * Upload attachment to Azure Blob Storage
 * @param {string} docId - Document ID
 * @param {string} attachmentName - Attachment name
 * @param {string} base64Data - Base64 encoded attachment data
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} Blob URL
 */
async function uploadToBlob(docId, attachmentName, base64Data, contentType) {
  const { sasToken } = BLOB_STORAGE_CONFIG;
  
  if (!isBlobStorageConfigured()) {
    console.warn('[syncManager] Blob Storage not configured, skipping upload');
    return null;
  }

  try {
    // Create unique blob name: docId/attachmentName
    const blobName = `${docId.replace(/[:#]/g, '_')}/${attachmentName}`;
    const blobUrl = `${getBlobBaseUrl()}/${blobName}`;
    
    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Upload to Blob Storage
    const response = await fetch(`${blobUrl}?${sasToken}`, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': binaryData.length.toString()
      },
      body: binaryData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Blob upload failed: ${response.status} - ${errorText}`);
    }

    console.log('[syncManager] ✅ Blob uploaded:', blobName);
    return blobUrl;
  } catch (error) {
    console.error('[syncManager] ❌ Blob upload failed:', error.message);
    throw error;
  }
}

/**
 * Convert ArrayBuffer to base64 (handles large files without stack overflow)
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // Process in chunks to avoid stack overflow
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk);
  }
  
  return btoa(binary);
}

/**
 * Download attachment from Azure Blob Storage
 * @param {string} blobUrl - Full blob URL
 * @returns {Promise<{data: string, contentType: string}>} Base64 data and content type
 */
async function downloadFromBlob(blobUrl) {
  const { sasToken } = BLOB_STORAGE_CONFIG;
  
  if (!isBlobStorageConfigured()) {
    console.warn('[syncManager] Blob Storage not configured, skipping download');
    return null;
  }

  try {
    const response = await fetch(`${blobUrl}?${sasToken}`, {
      method: 'GET'
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[syncManager] Blob not found:', blobUrl);
        return null;
      }
      throw new Error(`Blob download failed: ${response.status}`);
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    return { data: base64, contentType };
  } catch (error) {
    console.error('[syncManager] ❌ Blob download failed:', error.message);
    return null;
  }
}

/**
 * Delete attachment from Azure Blob Storage
 * @param {string} blobUrl - Full blob URL
 */
async function deleteFromBlob(blobUrl) {
  const { sasToken } = BLOB_STORAGE_CONFIG;
  
  if (!isBlobStorageConfigured()) return;

  try {
    await fetch(`${blobUrl}?${sasToken}`, {
      method: 'DELETE'
    });
    console.log('[syncManager] Blob deleted:', blobUrl);
  } catch (error) {
    console.warn('[syncManager] Blob delete failed:', error.message);
  }
}

// =====================================================
// COUCHDB FUNCTIONS (EXISTING - PRESERVED)
// =====================================================

/**
 * Configure remote database with credentials (CouchDB)
 * This is the existing function - kept for backward compatibility
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

  console.log("[syncManager] CouchDB remote configured:", url.replace(/\/\/.*@/, '//***@'));
  return remoteDB;
}

/**
 * Test remote connection
 */
export async function testRemoteConnection() {
  if (isCouchDB()) {
    return testCouchDBConnection();
  } else if (isCosmosDB()) {
    return testCosmosDBConnection();
  }
  return false;
}

async function testCouchDBConnection() {
  if (!remoteDB) {
    console.error("[syncManager] Remote DB not configured");
    return false;
  }

  try {
    const info = await remoteDB.info();
    console.log("[syncManager] ✅ CouchDB connected:", info.db_name);
    return true;
  } catch (error) {
    console.error("[syncManager] ❌ CouchDB connection failed:", error.message);
    return false;
  }
}

// =====================================================
// COSMOS DB FUNCTIONS
// =====================================================

async function testCosmosDBConnection() {
  const { endpoint, key, database, container } = COSMOSDB_CONFIG;
  
  if (!endpoint || !key) {
    console.error("[syncManager] Cosmos DB not configured");
    return false;
  }

  try {
    const url = `${endpoint}dbs/${database}/colls/${container}`;
    const date = new Date().toUTCString();
    const resourceLink = `dbs/${database}/colls/${container}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-ms-date': date,
        'x-ms-version': '2018-12-31',
        'Authorization': await generateCosmosAuthToken('GET', 'colls', resourceLink, date, key)
      }
    });

    if (response.ok) {
      console.log("[syncManager] ✅ Cosmos DB connected");
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("[syncManager] ❌ Cosmos DB connection failed:", error.message);
    return false;
  }
}

/**
 * Generate Cosmos DB master key authorization token
 */
async function generateCosmosAuthToken(verb, resourceType, resourceLink, date, masterKey) {
  try {
    const keyBytes = Uint8Array.from(atob(masterKey), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const text = `${verb.toLowerCase()}\n${resourceType.toLowerCase()}\n${resourceLink}\n${date.toLowerCase()}\n\n`;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    return encodeURIComponent(`type=master&ver=1.0&sig=${base64Signature}`);
  } catch (error) {
    console.error("[syncManager] Auth token generation failed:", error);
    throw error;
  }
}

/**
 * Execute Cosmos DB REST request
 */
async function cosmosRequest(method, path, body = null, additionalHeaders = {}) {
  const { endpoint, key, database, container } = COSMOSDB_CONFIG;
  const url = `${endpoint}dbs/${database}/colls/${container}${path}`;
  const date = new Date().toUTCString();
  const resourceLink = `dbs/${database}/colls/${container}`;

  const headers = {
    'x-ms-date': date,
    'x-ms-version': '2018-12-31',
    'Content-Type': 'application/json',
    'Authorization': await generateCosmosAuthToken(method, 'docs', resourceLink, date, key),
    ...additionalHeaders
  };

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cosmos DB error ${response.status}: ${errorBody}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return null;
}

/**
 * Extract attachments from PouchDB document and upload to Blob Storage
 * Returns attachment metadata with blob URLs
 */
async function extractAndUploadAttachments(doc) {
  const attachmentMeta = {};
  
  if (!doc._attachments) {
    return { attachmentMeta, hasAttachments: false };
  }

  const attachmentNames = Object.keys(doc._attachments);
  if (attachmentNames.length === 0) {
    return { attachmentMeta, hasAttachments: false };
  }

  console.log(`[syncManager] Uploading ${attachmentNames.length} attachments for ${doc._id}`);

  for (const name of attachmentNames) {
    const attachment = doc._attachments[name];
    
    // Get base64 data
    let base64Data = attachment.data;
    
    // If it's a stub, we need to fetch it from PouchDB
    if (attachment.stub) {
      try {
        const blob = await localDB.getAttachment(doc._id, name);
        const reader = new FileReader();
        base64Data = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result;
            // Remove data URL prefix if present
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn(`[syncManager] Could not fetch attachment ${name}:`, error.message);
        continue;
      }
    }

    // Ensure we have data to upload
    if (!base64Data) {
      console.warn(`[syncManager] No data for attachment ${name}`);
      continue;
    }

    const contentType = attachment.content_type || 'application/octet-stream';

    try {
      // Upload to Blob Storage
      const blobUrl = await uploadToBlob(doc._id, name, base64Data, contentType);
      
      if (blobUrl) {
        attachmentMeta[name] = {
          blobUrl,
          content_type: contentType,
          length: attachment.length || base64Data.length,
          digest: attachment.digest || null
        };
      }
    } catch (error) {
      console.error(`[syncManager] Failed to upload attachment ${name}:`, error.message);
    }
  }

  return { attachmentMeta, hasAttachments: Object.keys(attachmentMeta).length > 0 };
}

/**
 * Download attachments from Blob Storage and convert to PouchDB format
 */
async function downloadAndRestoreAttachments(attachmentMeta) {
  const attachments = {};

  // Handle case where attachmentMeta is a string (JSON)
  let metaObj = attachmentMeta;
  if (typeof attachmentMeta === 'string') {
    try {
      metaObj = JSON.parse(attachmentMeta);
    } catch (e) {
      console.warn('[syncManager] Could not parse attachmentMeta string:', e.message);
      return attachments;
    }
  }

  if (!metaObj || typeof metaObj !== 'object') {
    return attachments;
  }

  for (const [name, meta] of Object.entries(metaObj)) {
    if (!meta || !meta.blobUrl) continue;

    try {
      const result = await downloadFromBlob(meta.blobUrl);
      
      if (result) {
        attachments[name] = {
          content_type: result.contentType || meta.content_type || 'application/octet-stream',
          data: result.data
        };
      }
    } catch (error) {
      console.warn(`[syncManager] Failed to download attachment ${name}:`, error.message);
    }
  }

  return attachments;
}

/**
 * Transform PouchDB document to Cosmos DB format
 * Strips attachments (they go to Blob Storage)
 */
function toCosmosFormat(doc, attachmentMeta = {}) {
  const cosmosDoc = {
    id: doc._id.replace(/[/#?\\]/g, '_'),
    _pouchId: doc._id,
    _pouchRev: doc._rev,
    ...doc,
    _ts: Math.floor(Date.now() / 1000)
  };
  
  // Remove PouchDB internal fields
  delete cosmosDoc._id;
  delete cosmosDoc._rev;
  
  // Replace _attachments with blob metadata (NOT the actual data)
  if (Object.keys(attachmentMeta).length > 0) {
    cosmosDoc._blobAttachments = attachmentMeta;
  }
  delete cosmosDoc._attachments;
  
  return cosmosDoc;
}

/**
 * Transform Cosmos DB document to PouchDB format
 * Restores attachments from Blob Storage
 */
async function toPouchFormat(cosmosDoc, fetchAttachments = true) {
  // Fields to EXCLUDE from copying (Cosmos-specific or problematic)
  const excludeFields = new Set([
    'id', '_pouchId', '_pouchRev', '_rid', '_self', '_etag', '_ts',
    '_attachments', '_blobAttachments'  // Handle attachments separately
  ]);
  
  // Start with required PouchDB fields
  const pouchDoc = {
    _id: cosmosDoc._pouchId || cosmosDoc.id,
    _rev: cosmosDoc._pouchRev || `1-${cosmosDoc._etag?.replace(/"/g, '') || Date.now()}`
  };
  
  // Selectively copy fields (skip excluded ones)
  for (const [key, value] of Object.entries(cosmosDoc)) {
    if (!excludeFields.has(key)) {
      pouchDoc[key] = value;
    }
  }
  
  // Restore attachments from Blob Storage if available
  if (fetchAttachments && cosmosDoc._blobAttachments) {
    try {
      const attachments = await downloadAndRestoreAttachments(cosmosDoc._blobAttachments);
      if (Object.keys(attachments).length > 0) {
        pouchDoc._attachments = attachments;
        console.log(`[syncManager] Restored ${Object.keys(attachments).length} attachments from Blob Storage`);
      }
    } catch (error) {
      console.warn('[syncManager] Failed to restore attachments:', error.message);
    }
  }
  
  return pouchDoc;
}

/**
 * Push a single document to Cosmos DB
 * Attachments are uploaded to Blob Storage
 */
async function pushDocumentToCosmosDB(doc) {
  if (!doc || doc._id.startsWith('_design/')) return;

  const cosmosId = doc._id.replace(/[/#?\\]/g, '_');

  if (doc._deleted) {
    try {
      // Delete from Cosmos DB
      await cosmosRequest('DELETE', `/docs/${cosmosId}`, null, {
        'x-ms-documentdb-partitionkey': `["${cosmosId}"]`
      });
      console.log('[syncManager] Cosmos: Deleted', doc._id);
    } catch (error) {
      if (!error.message.includes('404')) throw error;
    }
  } else {
    // Extract and upload attachments to Blob Storage
    const { attachmentMeta, hasAttachments } = await extractAndUploadAttachments(doc);
    
    if (hasAttachments) {
      console.log(`[syncManager] Uploaded ${Object.keys(attachmentMeta).length} attachments to Blob Storage`);
    }
    
    // Create Cosmos document (without attachment data)
    const cosmosDoc = toCosmosFormat(doc, attachmentMeta);
    
    // Check document size (Cosmos DB limit is 2MB)
    const docSize = JSON.stringify(cosmosDoc).length;
    if (docSize > 2000000) {
      console.error(`[syncManager] Document still too large after stripping attachments: ${doc._id} (${docSize} bytes)`);
      throw new Error(`Document too large: ${docSize} bytes`);
    }
    
    await cosmosRequest('POST', '/docs', cosmosDoc, {
      'x-ms-documentdb-is-upsert': 'True',
      'x-ms-documentdb-partitionkey': `["${cosmosId}"]`
    });
    console.log('[syncManager] Cosmos: Upserted', doc._id, hasAttachments ? `(${Object.keys(attachmentMeta).length} blobs)` : '');
  }
}

/**
 * Push all local documents to Cosmos DB
 */
async function pushToCosmosDB() {
  try {
    const localDocs = await localDB.allDocs({
      include_docs: true,
      attachments: true
    });

    let pushCount = 0;
    let errorCount = 0;
    
    for (const row of localDocs.rows) {
      if (row.doc && !row.id.startsWith('_design/')) {
        try {
          await pushDocumentToCosmosDB(row.doc);
          pushCount++;
        } catch (error) {
          console.error('[syncManager] Cosmos push failed:', row.id, error.message);
          errorCount++;
        }
      }
    }

    console.log(`[syncManager] Cosmos: Pushed ${pushCount} docs (${errorCount} errors)`);
    return pushCount;
  } catch (error) {
    console.error('[syncManager] Cosmos push failed:', error);
    throw error;
  }
}

/**
 * Pull documents from Cosmos DB
 */
async function pullFromCosmosDB() {
  try {
    const lastTs = lastSyncTime ? Math.floor(lastSyncTime.getTime() / 1000) : 0;
    
    const queryBody = {
      query: 'SELECT * FROM c WHERE c._ts > @lastSync',
      parameters: [{ name: '@lastSync', value: lastTs }]
    };

    const result = await cosmosRequest('POST', '/docs', queryBody, {
      'x-ms-documentdb-isquery': 'True',
      'x-ms-documentdb-query-enablecrosspartition': 'True',
      'Content-Type': 'application/query+json'
    });

    let pullCount = 0;
    let hasReports = false;
    let hasScreenshots = false;

    if (result && result.Documents) {
      for (const cosmosDoc of result.Documents) {
        try {
          // Convert to PouchDB format (with attachment restoration)
          const pouchDoc = await toPouchFormat(cosmosDoc, true);
          
          // Check for existing document
          let existingDoc;
          try {
            existingDoc = await localDB.get(pouchDoc._id);
            pouchDoc._rev = existingDoc._rev;
          } catch (e) {
            delete pouchDoc._rev;
          }

          await localDB.put(pouchDoc);
          pullCount++;

          if (pouchDoc._id.startsWith('report:')) hasReports = true;
          if (pouchDoc._id.startsWith('screenshot:')) hasScreenshots = true;
        } catch (error) {
          if (error.status !== 409) {
            console.error('[syncManager] Cosmos pull doc failed:', cosmosDoc.id, error.message);
          }
        }
      }

      if (pullCount > 0) {
        console.log('[syncManager] Cosmos: Pulled', pullCount, 'docs');
        
        eventBus.emit('data-synced', {
          direction: 'pull',
          docCount: pullCount,
          hasReports,
          hasScreenshots,
          backend: 'cosmosdb'
        });
      }
    }

    lastSyncTime = new Date();
    return pullCount;
  } catch (error) {
    console.error('[syncManager] Cosmos pull failed:', error);
    throw error;
  }
}

/**
 * Full Cosmos DB sync (push + pull)
 */
async function syncCosmosDB() {
  await pushToCosmosDB();
  await pullFromCosmosDB();
  lastSyncTime = new Date();
}

// =====================================================
// UNIFIED SYNC FUNCTIONS
// =====================================================

/**
 * Initialize sync based on environment configuration
 */
export function initializeFromEnv() {
  console.log("[syncManager] Auto-initializing from environment...");
  console.log("[syncManager] Initializing with backend:", SYNC_BACKEND);

  if (isCouchDB()) {
    const { url, username, password, database } = COUCHDB_CONFIG;
    if (url) {
      const fullUrl = username && password
        ? `${url.replace('://', `://${username}:${password}@`)}/${database}`
        : `${url}/${database}`;
      configureRemote(fullUrl, username, password);
    }
  } else if (isCosmosDB()) {
    console.log("[syncManager] Cosmos DB backend - using REST sync");
    
    if (isBlobStorageConfigured()) {
      console.log("[syncManager] ✅ Azure Blob Storage configured for attachments");
    } else {
      console.warn("[syncManager] ⚠️ Azure Blob Storage NOT configured - attachments will be skipped");
    }
  }

  return SYNC_BACKEND;
}

/**
 * Start live bidirectional sync
 */
export function startSync() {
  if (isCouchDB()) {
    return startCouchDBSync();
  } else if (isCosmosDB()) {
    return startCosmosDBSync();
  }
  
  console.error("[syncManager] Unknown backend:", SYNC_BACKEND);
  return null;
}

/**
 * Start CouchDB sync (existing logic preserved)
 */
function startCouchDBSync() {
  if (!remoteDB) {
    console.error("[syncManager] Cannot start sync - remote DB not configured");
    return null;
  }

  if (syncHandler) {
    console.log("[syncManager] Sync already running");
    return syncHandler;
  }

  console.log("[syncManager] Starting CouchDB live sync...");

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
      lastSyncTime = new Date();
      
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
          hasScreenshots,
          backend: 'couchdb'
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
 * Start Cosmos DB sync
 */
function startCosmosDBSync() {
  if (cosmosPollingInterval) {
    console.log("[syncManager] Cosmos DB sync already running");
    return cosmosPollingInterval;
  }

  console.log("[syncManager] Starting Cosmos DB sync...");

  // Initial sync
  syncCosmosDB().catch(console.error);

  // Poll for changes every 10 seconds
  const pollInterval = 10000;
  cosmosPollingInterval = setInterval(async () => {
    try {
      await pullFromCosmosDB();
    } catch (error) {
      console.error("[syncManager] Cosmos DB poll error:", error);
    }
  }, pollInterval);

  // Watch local changes and push immediately
  localChangesHandler = localDB.changes({
    since: 'now',
    live: true,
    include_docs: true,
    attachments: true
  }).on('change', async (change) => {
    if (change.doc && !change.doc._id.startsWith('_design/')) {
      try {
        await pushDocumentToCosmosDB(change.doc);
        
        eventBus.emit('data-synced', {
          direction: 'push',
          docCount: 1,
          hasReports: change.doc._id.startsWith('report:'),
          hasScreenshots: change.doc._id.startsWith('screenshot:'),
          backend: 'cosmosdb'
        });
      } catch (error) {
        console.error("[syncManager] Push to Cosmos failed:", error.message);
      }
    }
  });

  return cosmosPollingInterval;
}

/**
 * Stop sync
 */
export function stopSync() {
  // Stop CouchDB sync
  if (syncHandler) {
    syncHandler.cancel();
    syncHandler = null;
    console.log("[syncManager] CouchDB sync stopped");
  }

  // Stop Cosmos DB polling
  if (cosmosPollingInterval) {
    clearInterval(cosmosPollingInterval);
    cosmosPollingInterval = null;
    console.log("[syncManager] Cosmos DB polling stopped");
  }

  // Stop local changes handler
  if (localChangesHandler) {
    localChangesHandler.cancel();
    localChangesHandler = null;
    console.log("[syncManager] Local changes handler stopped");
  }
}

/**
 * Sync once (not live)
 */
export async function syncOnce() {
  if (isCouchDB()) {
    if (!remoteDB) {
      throw new Error("Remote DB not configured");
    }

    console.log("[syncManager] CouchDB syncing once...");
    const result = await localDB.sync(remoteDB, { retry: false });
    lastSyncTime = new Date();
    console.log("[syncManager] Sync complete");
    return result;
  } else if (isCosmosDB()) {
    console.log("[syncManager] Cosmos DB syncing once...");
    await syncCosmosDB();
    console.log("[syncManager] Sync complete");
    return { pushed: true, pulled: true };
  }

  throw new Error("Unknown backend");
}

// =====================================================
// STATUS & GETTERS (EXISTING - ENHANCED)
// =====================================================

/**
 * Get sync status
 */
export function getSyncStatus() {
  const backend = SYNC_BACKEND;
  const isActive = isCouchDB() ? !!syncHandler : !!cosmosPollingInterval;

  return {
    status: isActive ? 'active' : 'idle',
    isActive,
    backend,
    backendDisplayName: getBackendDisplayName(),
    remoteUrl: isCouchDB() ? REMOTE_URL : COSMOSDB_CONFIG.endpoint,
    blobStorageConfigured: isBlobStorageConfigured(),
    lastSync: lastSyncTime
  };
}

/**
 * Get remote DB instance (CouchDB only)
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
 * Get sync handler (CouchDB only)
 */
export function getSyncHandler() {
  return syncHandler;
}

/**
 * Get remote URL
 */
export function getRemoteUrl() {
  return isCouchDB() ? REMOTE_URL : COSMOSDB_CONFIG.endpoint;
}

/**
 * Get last sync time
 */
export function getLastSyncTime() {
  return lastSyncTime;
}

// =====================================================
// AUTO-INITIALIZATION
// =====================================================

// Auto-initialize from env if configured
if (COUCHDB_CONFIG.url || COSMOSDB_CONFIG.endpoint) {
  initializeFromEnv();
}
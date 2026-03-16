// src/services/sync/CosmosDBSyncService.js

import { ISyncService } from './ISyncService';

/**
 * Cosmos DB Sync Service
 * Uses Cosmos DB REST API for sync operations
 * Implements custom bidirectional sync since Cosmos DB doesn't support CouchDB protocol
 */
export class CosmosDBSyncService extends ISyncService {
  constructor(localDB, config) {
    super(localDB, config);
    this.lastSync = null;
    this.pendingChanges = 0;
    this.continuationToken = null;
    this.syncInterval = null;
    this.localSequence = null;
  }

  /**
   * Get Cosmos DB REST API headers
   */
  getHeaders(method, resourceType, resourceLink) {
    const date = new Date().toUTCString();
    const key = this.config.cosmosdb.key;
    
    // Generate authorization token
    const authToken = this.generateAuthToken(method, resourceType, resourceLink, date, key);
    
    return {
      'Authorization': authToken,
      'x-ms-date': date,
      'x-ms-version': '2018-12-31',
      'Content-Type': 'application/json',
      'x-ms-documentdb-partitionkey': '["default"]'
    };
  }

  /**
   * Generate Cosmos DB authorization token
   */
  generateAuthToken(method, resourceType, resourceLink, date, key) {
    const crypto = window.crypto || window.msCrypto;
    
    // For browser environment, we'll use a simplified approach
    // In production, this should be done via a backend proxy for security
    const text = `${method.toLowerCase()}\n${resourceType.toLowerCase()}\n${resourceLink}\n${date.toLowerCase()}\n\n`;
    
    // Note: In production, use Azure Functions or backend to generate token
    // This is a simplified version for demonstration
    return `type=master&ver=1.0&sig=${encodeURIComponent(key)}`;
  }

  /**
   * Get Cosmos DB endpoint URL
   */
  getEndpoint(path = '') {
    const { endpoint, database, container } = this.config.cosmosdb;
    return `${endpoint}dbs/${database}/colls/${container}${path}`;
  }

  /**
   * Fetch from Cosmos DB with error handling
   */
  async cosmosRequest(method, path, body = null, additionalHeaders = {}) {
    const url = this.getEndpoint(path);
    const resourceLink = `dbs/${this.config.cosmosdb.database}/colls/${this.config.cosmosdb.container}`;
    
    const headers = {
      ...this.getHeaders(method, 'docs', resourceLink),
      ...additionalHeaders
    };

    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    };

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Cosmos DB error ${response.status}: ${errorBody}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[CosmosDB] Request failed:', error);
      throw error;
    }
  }

  /**
   * Transform PouchDB document to Cosmos DB format
   */
  toCosmosFormat(doc) {
    const cosmosDoc = {
      id: doc._id,
      _rid: doc._id,
      ...doc,
      // Cosmos DB specific
      _ts: Date.now(),
      _cosmosRev: doc._rev,
      // Partition key
      category: doc.category || 'default'
    };
    
    // Remove PouchDB specific fields that conflict
    delete cosmosDoc._id;
    delete cosmosDoc._rev;
    
    return cosmosDoc;
  }

  /**
   * Transform Cosmos DB document to PouchDB format
   */
  toPouchFormat(doc) {
    const pouchDoc = {
      _id: doc.id,
      _rev: doc._cosmosRev || `1-${doc._etag?.replace(/"/g, '') || Date.now()}`,
      ...doc
    };
    
    // Remove Cosmos DB specific fields
    delete pouchDoc.id;
    delete pouchDoc._rid;
    delete pouchDoc._self;
    delete pouchDoc._etag;
    delete pouchDoc._attachments;
    delete pouchDoc._ts;
    delete pouchDoc._cosmosRev;
    
    return pouchDoc;
  }

  async startSync() {
    if (this.isActive) {
      console.log('[CosmosDB] Sync already active');
      return;
    }

    // Initial sync
    await this.syncOnce();

    // Start polling for changes
    const pollInterval = this.config.sync.heartbeat || 10000;
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncOnce();
      } catch (error) {
        console.error('[CosmosDB] Sync interval error:', error);
        this.emit('error', { type: 'interval', error });
      }
    }, pollInterval);

    // Listen for local changes
    this.localChangesHandler = this.localDB.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).on('change', async (change) => {
      try {
        await this.pushDocument(change.doc);
        this.emit('change', { direction: 'push', docs: [change.doc] });
      } catch (error) {
        console.error('[CosmosDB] Push on change failed:', error);
      }
    });

    this.isActive = true;
    this.emit('active');
    console.log('[CosmosDB] Continuous sync started');
  }

  async stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.localChangesHandler) {
      this.localChangesHandler.cancel();
      this.localChangesHandler = null;
    }

    this.isActive = false;
    console.log('[CosmosDB] Sync stopped');
  }

  async syncOnce() {
    const pushed = await this.push();
    const pulled = await this.pull();
    
    this.lastSync = new Date();
    this.emit('complete', { pushed, pulled });
    
    return { pushed, pulled };
  }

  /**
   * Push a single document to Cosmos DB
   */
  async pushDocument(doc) {
    if (doc._deleted) {
      // Handle deletion
      try {
        await this.cosmosRequest('DELETE', `/docs/${doc._id}`);
        console.log('[CosmosDB] Deleted document:', doc._id);
      } catch (error) {
        // Ignore 404 errors (already deleted)
        if (!error.message.includes('404')) {
          throw error;
        }
      }
    } else {
      // Upsert document
      const cosmosDoc = this.toCosmosFormat(doc);
      
      try {
        await this.cosmosRequest('POST', '/docs', cosmosDoc, {
          'x-ms-documentdb-is-upsert': 'True'
        });
        console.log('[CosmosDB] Upserted document:', doc._id);
      } catch (error) {
        console.error('[CosmosDB] Upsert failed for:', doc._id, error);
        throw error;
      }
    }
  }

  async push() {
    try {
      // Get all local documents that need syncing
      const localDocs = await this.localDB.allDocs({
        include_docs: true,
        attachments: true
      });

      let pushCount = 0;

      for (const row of localDocs.rows) {
        if (row.doc && !row.id.startsWith('_design/')) {
          try {
            await this.pushDocument(row.doc);
            pushCount++;
          } catch (error) {
            console.error('[CosmosDB] Failed to push:', row.id, error);
          }
        }
      }

      console.log('[CosmosDB] Push complete:', pushCount, 'docs');
      return pushCount;
    } catch (error) {
      console.error('[CosmosDB] Push failed:', error);
      throw error;
    }
  }

  async pull() {
    try {
      // Query all documents from Cosmos DB
      const query = {
        query: 'SELECT * FROM c WHERE c._ts > @lastSync ORDER BY c._ts',
        parameters: [
          { name: '@lastSync', value: this.lastSync ? this.lastSync.getTime() : 0 }
        ]
      };

      const result = await this.cosmosRequest('POST', '/docs', query, {
        'x-ms-documentdb-isquery': 'True',
        'x-ms-documentdb-query-enablecrosspartition': 'True'
      });

      let pullCount = 0;

      if (result.Documents) {
        for (const cosmosDoc of result.Documents) {
          const pouchDoc = this.toPouchFormat(cosmosDoc);
          
          try {
            // Check if document exists locally
            let existingDoc;
            try {
              existingDoc = await this.localDB.get(pouchDoc._id);
            } catch (e) {
              // Document doesn't exist locally
            }

            if (existingDoc) {
              // Update with new revision
              pouchDoc._rev = existingDoc._rev;
            } else {
              // New document - remove _rev for insert
              delete pouchDoc._rev;
            }

            await this.localDB.put(pouchDoc);
            pullCount++;
          } catch (error) {
            // Handle conflicts
            if (error.status === 409) {
              console.log('[CosmosDB] Conflict for:', pouchDoc._id, '- keeping local version');
            } else {
              console.error('[CosmosDB] Failed to pull:', pouchDoc._id, error);
            }
          }
        }
      }

      console.log('[CosmosDB] Pull complete:', pullCount, 'docs');
      return pullCount;
    } catch (error) {
      console.error('[CosmosDB] Pull failed:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      backend: 'cosmosdb',
      isActive: this.isActive,
      lastSync: this.lastSync,
      pendingChanges: this.pendingChanges,
      endpoint: this.config.cosmosdb.endpoint,
      database: this.config.cosmosdb.database,
      container: this.config.cosmosdb.container
    };
  }
}

export default CosmosDBSyncService;
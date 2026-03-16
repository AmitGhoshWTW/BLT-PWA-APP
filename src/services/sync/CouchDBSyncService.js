// src/services/sync/CouchDBSyncService.js

import PouchDB from 'pouchdb';
import { ISyncService } from './ISyncService';

/**
 * CouchDB Sync Service
 * Uses native PouchDB replication protocol
 */
export class CouchDBSyncService extends ISyncService {
  constructor(localDB, config) {
    super(localDB, config);
    this.remoteDB = null;
    this.lastSync = null;
    this.pendingChanges = 0;
  }

  /**
   * Initialize remote database connection
   */
  initRemote() {
    if (!this.remoteDB) {
      const remoteUrl = this.config.couchdb.getFullUrl();
      this.remoteDB = new PouchDB(remoteUrl, {
        skip_setup: true
      });
      console.log('[CouchDB] Remote initialized:', remoteUrl.replace(/\/\/.*@/, '//***@'));
    }
    return this.remoteDB;
  }

  async startSync() {
    if (this.isActive) {
      console.log('[CouchDB] Sync already active');
      return;
    }

    this.initRemote();

    const syncOptions = {
      live: this.config.sync.live,
      retry: this.config.sync.retry,
      batch_size: this.config.sync.batchSize,
      heartbeat: this.config.sync.heartbeat,
      timeout: this.config.sync.timeout
    };

    this.syncHandler = this.localDB.sync(this.remoteDB, syncOptions)
      .on('change', (info) => {
        console.log('[CouchDB] Sync change:', info.direction, info.change.docs.length, 'docs');
        this.lastSync = new Date();
        this.emit('change', {
          direction: info.direction,
          docs: info.change.docs,
          docsWritten: info.change.docs_written
        });
      })
      .on('paused', (err) => {
        if (err) {
          console.log('[CouchDB] Sync paused with error:', err);
        } else {
          console.log('[CouchDB] Sync paused - up to date');
        }
        this.emit('paused', err);
      })
      .on('active', () => {
        console.log('[CouchDB] Sync active');
        this.emit('active');
      })
      .on('denied', (err) => {
        console.error('[CouchDB] Sync denied:', err);
        this.emit('error', { type: 'denied', error: err });
      })
      .on('complete', (info) => {
        console.log('[CouchDB] Sync complete:', info);
        this.isActive = false;
        this.emit('complete', info);
      })
      .on('error', (err) => {
        console.error('[CouchDB] Sync error:', err);
        this.emit('error', { type: 'error', error: err });
      });

    this.isActive = true;
    console.log('[CouchDB] Continuous sync started');
  }

  async stopSync() {
    if (this.syncHandler) {
      this.syncHandler.cancel();
      this.syncHandler = null;
    }
    this.isActive = false;
    console.log('[CouchDB] Sync stopped');
  }

  async syncOnce() {
    this.initRemote();

    try {
      const result = await this.localDB.sync(this.remoteDB, {
        batch_size: this.config.sync.batchSize
      });

      this.lastSync = new Date();
      
      const pushed = result.push?.docs_written || 0;
      const pulled = result.pull?.docs_written || 0;

      console.log('[CouchDB] One-time sync complete:', { pushed, pulled });
      
      return { pushed, pulled };
    } catch (error) {
      console.error('[CouchDB] One-time sync failed:', error);
      throw error;
    }
  }

  async push() {
    this.initRemote();

    try {
      const result = await this.localDB.replicate.to(this.remoteDB, {
        batch_size: this.config.sync.batchSize
      });

      this.lastSync = new Date();
      console.log('[CouchDB] Push complete:', result.docs_written, 'docs');
      
      return result.docs_written;
    } catch (error) {
      console.error('[CouchDB] Push failed:', error);
      throw error;
    }
  }

  async pull() {
    this.initRemote();

    try {
      const result = await this.localDB.replicate.from(this.remoteDB, {
        batch_size: this.config.sync.batchSize
      });

      this.lastSync = new Date();
      console.log('[CouchDB] Pull complete:', result.docs_written, 'docs');
      
      return result.docs_written;
    } catch (error) {
      console.error('[CouchDB] Pull failed:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      backend: 'couchdb',
      isActive: this.isActive,
      lastSync: this.lastSync,
      pendingChanges: this.pendingChanges,
      remoteUrl: this.config.couchdb.url
    };
  }
}

export default CouchDBSyncService;
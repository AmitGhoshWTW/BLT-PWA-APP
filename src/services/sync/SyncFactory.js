// src/services/sync/SyncFactory.js

import { databaseConfig, DatabaseBackend, validateConfig } from '../../config/database.config';
import { CouchDBSyncService } from './CouchDBSyncService';
import { CosmosDBSyncService } from './CosmosDBSyncService';

/**
 * Factory to create appropriate sync service based on configuration
 */
export class SyncFactory {
  static instance = null;
  static syncService = null;

  /**
   * Create or get sync service singleton
   * @param {PouchDB} localDB - Local PouchDB instance
   * @returns {ISyncService}
   */
  static createSyncService(localDB) {
    if (this.syncService) {
      return this.syncService;
    }

    if (!validateConfig()) {
      console.error('[SyncFactory] Invalid configuration');
      throw new Error('Database configuration is invalid');
    }

    const backend = databaseConfig.backend;
    console.log('[SyncFactory] Creating sync service for backend:', backend);

    switch (backend) {
      case DatabaseBackend.COUCHDB:
        this.syncService = new CouchDBSyncService(localDB, databaseConfig);
        break;

      case DatabaseBackend.COSMOSDB:
        this.syncService = new CosmosDBSyncService(localDB, databaseConfig);
        break;

      default:
        throw new Error(`Unknown database backend: ${backend}`);
    }

    return this.syncService;
  }

  /**
   * Get current sync service (must be created first)
   */
  static getSyncService() {
    if (!this.syncService) {
      throw new Error('Sync service not initialized. Call createSyncService first.');
    }
    return this.syncService;
  }

  /**
   * Destroy current sync service
   */
  static async destroySyncService() {
    if (this.syncService) {
      await this.syncService.stopSync();
      this.syncService = null;
    }
  }

  /**
   * Get current backend type
   */
  static getBackendType() {
    return databaseConfig.backend;
  }

  /**
   * Check if using CouchDB
   */
  static isCouchDB() {
    return databaseConfig.backend === DatabaseBackend.COUCHDB;
  }

  /**
   * Check if using Cosmos DB
   */
  static isCosmosDB() {
    return databaseConfig.backend === DatabaseBackend.COSMOSDB;
  }
}

export default SyncFactory;
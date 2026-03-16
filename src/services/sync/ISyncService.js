// src/services/sync/ISyncService.js

/**
 * Interface for sync services
 * Both CouchDB and Cosmos DB implementations must follow this contract
 */
export class ISyncService {
    constructor(localDB, config) {
      if (new.target === ISyncService) {
        throw new Error('ISyncService is an interface and cannot be instantiated directly');
      }
      this.localDB = localDB;
      this.config = config;
      this.syncHandler = null;
      this.isActive = false;
      this.listeners = new Map();
    }
  
    /**
     * Start continuous sync
     * @returns {Promise<void>}
     */
    async startSync() {
      throw new Error('startSync() must be implemented');
    }
  
    /**
     * Stop sync
     * @returns {Promise<void>}
     */
    async stopSync() {
      throw new Error('stopSync() must be implemented');
    }
  
    /**
     * Perform one-time sync (push + pull)
     * @returns {Promise<{pushed: number, pulled: number}>}
     */
    async syncOnce() {
      throw new Error('syncOnce() must be implemented');
    }
  
    /**
     * Push local changes to remote
     * @returns {Promise<number>} Number of documents pushed
     */
    async push() {
      throw new Error('push() must be implemented');
    }
  
    /**
     * Pull remote changes to local
     * @returns {Promise<number>} Number of documents pulled
     */
    async pull() {
      throw new Error('pull() must be implemented');
    }
  
    /**
     * Get sync status
     * @returns {{isActive: boolean, lastSync: Date, pendingChanges: number}}
     */
    getStatus() {
      throw new Error('getStatus() must be implemented');
    }
  
    /**
     * Add event listener
     * @param {string} event - 'change' | 'error' | 'paused' | 'active' | 'complete'
     * @param {Function} callback
     */
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  
    /**
     * Remove event listener
     */
    off(event, callback) {
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  
    /**
     * Emit event to listeners
     */
    emit(event, data) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(cb => cb(data));
      }
    }
  }
  
  export default ISyncService;
// src/config/database.config.js

export const DatabaseBackend = {
    COUCHDB: 'couchdb',
    COSMOSDB: 'cosmosdb'
  };
  
  export const databaseConfig = {
    // Active backend - controlled by environment variable
    backend: import.meta.env.VITE_SYNC_BACKEND || DatabaseBackend.COUCHDB,
    
    // CouchDB Configuration
    couchdb: {
      url: import.meta.env.VITE_COUCHDB_URL || 'http://localhost:5984',
      database: import.meta.env.VITE_COUCHDB_DATABASE || 'blt_reports',
      username: import.meta.env.VITE_COUCHDB_USERNAME || '',
      password: import.meta.env.VITE_COUCHDB_PASSWORD || '',
      
      // Build full URL with auth
      getFullUrl() {
        if (this.username && this.password) {
          const url = new URL(this.url);
          url.username = this.username;
          url.password = this.password;
          return `${url.origin}/${this.database}`;
        }
        return `${this.url}/${this.database}`;
      }
    },
    
    // Cosmos DB Configuration
    cosmosdb: {
      endpoint: import.meta.env.VITE_COSMOSDB_ENDPOINT || '',
      key: import.meta.env.VITE_COSMOSDB_KEY || '',
      database: import.meta.env.VITE_COSMOSDB_DATABASE || 'blt',
      container: import.meta.env.VITE_COSMOSDB_CONTAINER || 'reports',
      
      // Cosmos DB specific settings
      partitionKey: '/category',
      throughput: 400,
      maxRetries: 3,
      retryDelayMs: 1000
    },
    
    // Sync settings (common)
    sync: {
      live: true,
      retry: true,
      batchSize: 100,
      heartbeat: 10000,
      timeout: 30000
    }
  };
  
  // Validate configuration
  export function validateConfig() {
    const { backend, couchdb, cosmosdb } = databaseConfig;
    
    if (backend === DatabaseBackend.COUCHDB) {
      if (!couchdb.url) {
        console.warn('[Config] CouchDB URL not configured');
        return false;
      }
      return true;
    }
    
    if (backend === DatabaseBackend.COSMOSDB) {
      if (!cosmosdb.endpoint || !cosmosdb.key) {
        console.warn('[Config] Cosmos DB endpoint or key not configured');
        return false;
      }
      return true;
    }
    
    console.error('[Config] Invalid backend:', backend);
    return false;
  }
  
  export default databaseConfig;
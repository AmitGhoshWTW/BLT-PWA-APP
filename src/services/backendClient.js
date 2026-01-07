// src/services/backendClient.js

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

class BackendClient {
  constructor() {
    this.baseURL = BACKEND_URL;
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Generic fetch with timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - backend service may not be running');
      }
      
      throw error;
    }
  }

  /**
   * Check if backend service is available
   */
  async healthCheck() {
    try {
      const data = await this.fetchWithTimeout(`${this.baseURL}/api/health`);
      return data.status === 'ok';
    } catch (error) {
      console.error('[BackendClient] Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get configured log paths
   */
  async getLogPaths() {
    try {
      const data = await this.fetchWithTimeout(`${this.baseURL}/api/log-paths`);
      return data.paths || [];
    } catch (error) {
      console.error('[BackendClient] Error getting log paths:', error);
      throw error;
    }
  }

  /**
   * Test all configured paths
   */
  async testPaths() {
    try {
      const data = await this.fetchWithTimeout(`${this.baseURL}/api/log-paths/test`);
      return data.results || [];
    } catch (error) {
      console.error('[BackendClient] Error testing paths:', error);
      throw error;
    }
  }

  /**
   * Auto-collect all log files
   */
  async autoCollectLogs() {
    try {
      console.log('[BackendClient] Requesting auto-collect...');
      
      const data = await this.fetchWithTimeout(`${this.baseURL}/api/log-files/auto-collect`);
      
      console.log('[BackendClient] Auto-collect response:', {
        collected: data.collected?.length || 0,
        failed: data.failed?.length || 0
      });

      return data;
    } catch (error) {
      console.error('[BackendClient] Error in auto-collect:', error);
      throw error;
    }
  }

  /**
   * Read single log file by path
   */
  async readLogFile(path) {
    try {
      const data = await this.fetchWithTimeout(`${this.baseURL}/api/log-file/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path })
      });

      return data.fileData;
    } catch (error) {
      console.error('[BackendClient] Error reading log file:', error);
      throw error;
    }
  }

  /**
   * Read log file by ID (from config)
   */
  async readLogFileById(id) {
    try {
      const data = await this.fetchWithTimeout(`${this.baseURL}/api/log-file/${id}`);
      return data.fileData;
    } catch (error) {
      console.error('[BackendClient] Error reading log file by ID:', error);
      throw error;
    }
  }

  /**
   * Convert file data from backend to File object
   */
  createFileFromData(fileData) {
    const blob = new Blob([fileData.content], { type: 'text/plain' });
    
    const file = new File([blob], fileData.filename, {
      type: 'text/plain',
      lastModified: fileData.modified ? new Date(fileData.modified).getTime() : Date.now()
    });

    return file;
  }
}

export const backendClient = new BackendClient();
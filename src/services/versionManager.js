// src/services/versionManager.js
import eventBus from '../utils/eventBus';

const CURRENT_VERSION = "2.0.1";
const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds

class VersionManager {
  constructor() {
    this.currentVersion = CURRENT_VERSION;
    this.latestVersion = null;
    this.updateAvailable = false;
    this.checkInterval = null;
  }

  /**
   * Get current app version
   */
  getCurrentVersion() {
    return this.currentVersion;
  }

  /**
   * Start periodic version checking
   */
  startVersionCheck() {
    console.log('[VersionManager] Starting version check...');
    
    // Check immediately
    this.checkForUpdates();
    
    // Check periodically
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, VERSION_CHECK_INTERVAL);
  }

  /**
   * Stop version checking
   */
  stopVersionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check for updates
   */
  async checkForUpdates() {
    try {
      // Fetch version.json from server with cache busting
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        console.warn('[VersionManager] Failed to fetch version info');
        return false;
      }

      const versionInfo = await response.json();
      this.latestVersion = versionInfo.version;

      console.log('[VersionManager] Version check:', {
        current: this.currentVersion,
        latest: this.latestVersion
      });

      // Compare versions
      if (this.isNewerVersion(this.latestVersion, this.currentVersion)) {
        console.log('[VersionManager] 🎉 Update available!');
        this.updateAvailable = true;
        
        // Emit event
        eventBus.emit('update-available', {
          currentVersion: this.currentVersion,
          latestVersion: this.latestVersion,
          releaseNotes: versionInfo.releaseNotes || []
        });

        return true;
      }

      return false;

    } catch (error) {
      console.error('[VersionManager] Version check error:', error);
      return false;
    }
  }

  /**
   * Compare version strings
   */
  isNewerVersion(latest, current) {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }

    return false;
  }

  /**
   * Apply update (reload app)
   */
  applyUpdate() {
    console.log('[VersionManager] Applying update...');
    
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
          console.log('[VersionManager] Cleared cache:', name);
        });
      });
    }

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
          console.log('[VersionManager] Unregistered SW');
        });
      });
    }

    // Reload after a short delay
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  }

  /**
   * Check if update is available
   */
  isUpdateAvailable() {
    return this.updateAvailable;
  }

  /**
   * Get latest version
   */
  getLatestVersion() {
    return this.latestVersion;
  }
}

// Export singleton
export const versionManager = new VersionManager();
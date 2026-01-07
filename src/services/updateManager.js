// src/services/updateManager.js
import systemLogger from "./systemLogger";

class UpdateManager {
  constructor() {
    this.updateAvailable = false;
    this.newWorker = null;
    this.listeners = [];
    this.checkInterval = null;
  }

  /* =========================================
     INITIALIZATION
  ========================================= */

  init() {
    if (!("serviceWorker" in navigator)) {
      console.warn("[UpdateManager] Service Worker not supported");
      return;
    }

    console.log("[UpdateManager] Initializing update manager...");
    systemLogger.logInfo("Update manager initialized");

    this.registerServiceWorker();
    this.setupUpdateDetection();
    this.schedulePeriodicChecks();
  }

  /* =========================================
     SERVICE WORKER REGISTRATION
  ========================================= */

  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none" // Always check for updates
      });

      console.log("[UpdateManager] Service Worker registered:", registration.scope);
      systemLogger.logInfo("Service Worker registered", {
        scope: registration.scope
      });

      // Check for updates immediately
      await this.checkForUpdates(registration);

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        this.handleUpdateFound(registration);
      });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        this.handleControllerChange();
      });

      return registration;
    } catch (error) {
      console.error("[UpdateManager] Service Worker registration failed:", error);
      systemLogger.logError("Service Worker registration failed", {
        error: error.message
      });
      throw error;
    }
  }

  /* =========================================
     UPDATE DETECTION
  ========================================= */

  setupUpdateDetection() {
    // Check on page visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });

    // Check on network reconnection
    window.addEventListener("online", () => {
      console.log("[UpdateManager] Network restored, checking for updates...");
      this.checkForUpdates();
    });
  }

  async checkForUpdates(registration) {
    try {
      if (!registration) {
        registration = await navigator.serviceWorker.getRegistration();
      }

      if (!registration) {
        console.warn("[UpdateManager] No service worker registration found");
        return false;
      }

      console.log("[UpdateManager] Checking for updates...");
      await registration.update();

      return true;
    } catch (error) {
      console.error("[UpdateManager] Error checking for updates:", error);
      systemLogger.logError("Update check failed", {
        error: error.message
      });
      return false;
    }
  }

  handleUpdateFound(registration) {
    const newWorker = registration.installing;
    
    if (!newWorker) return;

    console.log("[UpdateManager] Update found, installing...");
    systemLogger.logInfo("App update found", {
      state: newWorker.state
    });

    this.newWorker = newWorker;

    newWorker.addEventListener("statechange", () => {
      console.log("[UpdateManager] Service Worker state:", newWorker.state);

      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        // New version is installed and ready
        this.updateAvailable = true;
        this.notifyListeners({
          type: "update-available",
          worker: newWorker
        });

        systemLogger.logInfo("App update ready to install", {
          version: this.getAppVersion()
        });
      }
    });
  }

  handleControllerChange() {
    console.log("[UpdateManager] New service worker activated");
    systemLogger.logInfo("App updated successfully");

    this.notifyListeners({
      type: "update-activated"
    });

    // Optionally reload the page
    if (this.shouldAutoReload()) {
      console.log("[UpdateManager] Reloading to apply updates...");
      window.location.reload();
    }
  }

  /* =========================================
     PERIODIC UPDATE CHECKS
  ========================================= */

  schedulePeriodicChecks(intervalMinutes = 60) {
    // Check for updates every hour
    this.checkInterval = setInterval(() => {
      console.log("[UpdateManager] Performing scheduled update check...");
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /* =========================================
     UPDATE APPLICATION
  ========================================= */

  async applyUpdate() {
    if (!this.newWorker) {
      console.warn("[UpdateManager] No update available to apply");
      return false;
    }

    try {
      console.log("[UpdateManager] Applying update...");
      systemLogger.logInfo("Applying app update");

      // Tell the waiting service worker to skip waiting
      this.newWorker.postMessage({ type: "SKIP_WAITING" });

      // The controllerchange event will handle the reload
      return true;
    } catch (error) {
      console.error("[UpdateManager] Error applying update:", error);
      systemLogger.logError("Update application failed", {
        error: error.message
      });
      return false;
    }
  }

  async skipWaitingAndReload() {
    await this.applyUpdate();
    // Controller change will trigger reload
  }

  /* =========================================
     VERSION MANAGEMENT
  ========================================= */

  getAppVersion() {
    // Try to get version from service worker or manifest
    const meta = document.querySelector('meta[name="app-version"]');
    return meta?.content || "2.0.0";
  }

  async getInstalledVersion() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active) {
        // Try to get version from SW
        return this.getAppVersion();
      }
    } catch (error) {
      console.error("[UpdateManager] Error getting installed version:", error);
    }
    return "unknown";
  }

  /* =========================================
     LISTENER MANAGEMENT
  ========================================= */

  onUpdate(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error("[UpdateManager] Listener error:", error);
      }
    });
  }

  /* =========================================
     CONFIGURATION
  ========================================= */

  shouldAutoReload() {
    // Check if auto-reload is enabled in localStorage
    return localStorage.getItem("autoUpdateReload") === "true";
  }

  setAutoReload(enabled) {
    localStorage.setItem("autoUpdateReload", enabled ? "true" : "false");
  }

  /* =========================================
     CACHE MANAGEMENT
  ========================================= */

  async clearOldCaches() {
    try {
      const cacheNames = await caches.keys();
      const currentCache = "blt-cache-v1"; // Should match your SW cache name

      const oldCaches = cacheNames.filter(name => name !== currentCache);

      await Promise.all(
        oldCaches.map(name => {
          console.log("[UpdateManager] Deleting old cache:", name);
          return caches.delete(name);
        })
      );

      console.log(`[UpdateManager] Cleared ${oldCaches.length} old caches`);
      systemLogger.logInfo("Old caches cleared", {
        count: oldCaches.length
      });
    } catch (error) {
      console.error("[UpdateManager] Error clearing caches:", error);
    }
  }

  async getCacheStatus() {
    try {
      const cacheNames = await caches.keys();
      const status = [];

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        status.push({
          name,
          size: keys.length
        });
      }

      return status;
    } catch (error) {
      console.error("[UpdateManager] Error getting cache status:", error);
      return [];
    }
  }

  /* =========================================
     FORCED UPDATE
  ========================================= */

  async forceUpdate() {
    try {
      console.log("[UpdateManager] Forcing update...");
      systemLogger.logInfo("Forcing app update");

      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));

      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      // Reload
      window.location.reload(true);
    } catch (error) {
      console.error("[UpdateManager] Force update failed:", error);
      systemLogger.logError("Force update failed", {
        error: error.message
      });
    }
  }

  /* =========================================
     STATUS
  ========================================= */

  getStatus() {
    return {
      updateAvailable: this.updateAvailable,
      hasNewWorker: this.newWorker !== null,
      autoReload: this.shouldAutoReload(),
      version: this.getAppVersion(),
      swSupported: "serviceWorker" in navigator
    };
  }
}

// Singleton instance
const updateManager = new UpdateManager();

export default updateManager;
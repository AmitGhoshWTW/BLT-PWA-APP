// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Services
import { localDB, createIndexes } from "./services/pouchdbService";
import { configureRemote, testRemoteConnection, startSync, getRemoteDB } from "./services/syncManager";
import updateManager from "./services/updateManager";
import { versionManager } from "./services/versionManager"; // NEW

/* =========================================
   CONFIGURATION
========================================= */

const COUCHDB_URL = import.meta.env.VITE_COUCHDB_URL || "http://localhost:5984/blt_remote_db";
const COUCHDB_USER = import.meta.env.VITE_COUCHDB_USER || "admin";
const COUCHDB_PASSWORD = import.meta.env.VITE_COUCHDB_PASSWORD || "adminpassword";

const INIT_FLAG = 'blt_initialized';
const APP_VERSION = "2.0.1";

/* =========================================
   INITIALIZATION
========================================= */

async function initializeApp() {
  try {
    console.log("[main] 🚀 Starting BLT PWA v" + APP_VERSION);

    // ===== 1. Initialize Service Worker =====
    console.log("[main] Initializing update manager...");
    updateManager.init();

    // Listen for app updates
    updateManager.onUpdate((event) => {
      if (event.type === "update-available") {
        console.log("[main] 📦 App update available!");
        console.log("[main] 📦 Service Worker update available!");
        
        // Notify UI
        window.dispatchEvent(new CustomEvent("app-update-available", {
          detail: { version: APP_VERSION }
        }));
      }
    });

    // ===== 2. Initialize Database Indexes (First Run Only) =====
    const isFirstRun = !localStorage.getItem(INIT_FLAG);
    
    if (isFirstRun) {
      console.log("[main] First run detected, creating indexes...");
      await createIndexes();
      localStorage.setItem(INIT_FLAG, 'true');
      console.log("[main] ✅ Indexes created");
    } else {
      console.log("[main] ✅ App already initialized (skipping index creation)");
    }

    // ===== 3. Verify Local Database =====
    const localInfo = await localDB.info();
    console.log("[main] ✅ Local database ready:", {
      docs: localInfo.doc_count,
      seq: localInfo.update_seq
    });

    // ===== 4. Configure Remote Database =====
    if (COUCHDB_URL && COUCHDB_URL !== '') {
      try {
        console.log("[main] Configuring remote database...");
        configureRemote(COUCHDB_URL, COUCHDB_USER, COUCHDB_PASSWORD);

        // Test connection in background (non-blocking)
        console.log("[main] Testing remote connection...");
        testRemoteConnection().then(connected => {
          if (connected) {
            console.log("[main] ✅ Remote database connected successfully!");
            
            // Start live sync
            console.log("[main] Starting live synchronization...");
            startSync();
            console.log("[main] ✅ Live sync active");
          } else {
            throw new Error("Connection test failed");
          }
        }).catch(error => {
          console.warn("[main] ⚠️ Remote connection failed:", error.message);
          console.log("[main] Continuing in offline mode");
        });

      } catch (error) {
        console.warn("[main] Remote database setup failed:", error.message);
        console.log("[main] Running in offline mode");
      }
    } else {
      console.log("[main] No remote database configured - offline mode");
    }

    // ===== 5. Initialize Debug Tools =====
    window.__BLT_DEBUG__ = {
      localDB,
      remoteDB: getRemoteDB,
      updateManager,
      versionManager, // NEW
      version: APP_VERSION,
      
      // Database Info
      getDatabaseInfo: async () => {
        const info = await localDB.info();
        const reports = await localDB.allDocs({ 
          startkey: 'report:', 
          endkey: 'report:\uffff' 
        });
        const screenshots = await localDB.allDocs({ 
          startkey: 'screenshot:', 
          endkey: 'screenshot:\uffff' 
        });
        return {
          totalDocs: info.doc_count,
          reports: reports.rows.length,
          screenshots: screenshots.rows.length,
          updateSeq: info.update_seq
        };
      },
      
      // Clean up old logs
      deleteAllLogs: async () => {
        const logs = await localDB.allDocs({
          include_docs: true,
          startkey: 'log:',
          endkey: 'log:\uffff'
        });
        
        if (logs.rows.length === 0) {
          console.log('No logs to delete');
          return 0;
        }
        
        const docsToDelete = logs.rows.map(row => ({
          _id: row.doc._id,
          _rev: row.doc._rev,
          _deleted: true
        }));
        
        await localDB.bulkDocs(docsToDelete);
        console.log(`✅ Deleted ${docsToDelete.length} logs`);
        return docsToDelete.length;
      },
      
      // Reset initialization flag
      resetInitFlag: () => {
        localStorage.removeItem(INIT_FLAG);
        console.log('✅ Reset init flag - indexes will be recreated on next load');
      },

      // NEW: Force update check
      checkForUpdates: async () => {
        const available = await versionManager.checkForUpdates();
        if (available) {
          console.log('✅ Update available!');
        } else {
          console.log('✅ Already on latest version');
        }
        return available;
      },
      
      // Capture current state
      captureAppState: () => {
        return {
          version: APP_VERSION,
          timestamp: new Date().toISOString(),
          online: navigator.onLine,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          url: window.location.href,
          localStorage: {
            initialized: localStorage.getItem(INIT_FLAG)
          }
        };
      }
    };

    console.log("[main] ✅ Initialization complete");
    console.log("[main] Debug tools available at window.__BLT_DEBUG__");

  } catch (error) {
    console.error("[main] ❌ Critical initialization error:", error);
    throw error;
  }
}

/* =========================================
   RENDER APPLICATION
========================================= */

initializeApp()
  .then(() => {
    // Render React app
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    // Show error UI if initialization fails
    console.error("[main] Failed to start application:", error);
    
    document.getElementById("root").innerHTML = `
      <div style="
        padding: 40px;
        max-width: 600px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <h2 style="color: #d32f2f; margin-bottom: 16px;">
          ⚠️ Initialization Error
        </h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          The application failed to start. Please check your connection and try again.
        </p>
        <details style="
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        ">
          <summary style="cursor: pointer; font-weight: 500; margin-bottom: 8px;">
            Error Details
          </summary>
          <pre style="
            margin: 8px 0 0 0;
            overflow: auto;
            font-size: 13px;
            color: #333;
          ">${error.message}

${error.stack || 'No stack trace available'}</pre>
        </details>
        <button onclick="window.location.reload()" style="
          padding: 12px 24px;
          background: #0078d7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        ">
          🔄 Retry
        </button>
      </div>
    `;
  });

/* =========================================
   CLEANUP ON UNLOAD
========================================= */

window.addEventListener("beforeunload", () => {
  console.log("[main] Application shutting down...");
});

/* =========================================
   GLOBAL ERROR HANDLERS
========================================= */

window.addEventListener("error", (event) => {
  console.error("[main] Global error:", {
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    column: event.colno
  });
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[main] Unhandled promise rejection:", {
    reason: event.reason?.message || event.reason,
    stack: event.reason?.stack
  });
});

/* =========================================
   PERFORMANCE MONITORING
========================================= */

if (window.performance && window.performance.timing) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      console.log("[main] Performance metrics:", {
        loadTime: `${loadTime}ms`,
        domReadyTime: `${domReadyTime}ms`,
        dnsTime: `${timing.domainLookupEnd - timing.domainLookupStart}ms`,
        tcpTime: `${timing.connectEnd - timing.connectStart}ms`,
        requestTime: `${timing.responseEnd - timing.requestStart}ms`,
        renderTime: `${timing.domComplete - timing.domLoading}ms`
      });
    }, 0);
  });
}

/* =========================================
   NETWORK STATUS MONITORING
========================================= */

window.addEventListener("online", () => {
  console.log("[main] 🌐 Network status: ONLINE");
  
  
  // Notify UI
  window.dispatchEvent(new CustomEvent("network-status-change", {
    detail: { online: true }
  }));
});

window.addEventListener("offline", () => {
  console.log("[main] 📡 Network status: OFFLINE");
  
  // Notify UI
  window.dispatchEvent(new CustomEvent("network-status-change", {
    detail: { online: false }
  }));
});
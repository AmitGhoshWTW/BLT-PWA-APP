// // const CACHE_VERSION = "v1"; // bump on every release
// // const CACHE_NAME = `blt-cache-${CACHE_VERSION}`;
// // const CORE_ASSETS = ["/", "/index.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

// // async function precache() {
// //   const cache = await caches.open(CACHE_NAME);
// //   // pre-cache core
// //   await cache.addAll(CORE_ASSETS);

// //   // Try to fetch Vite manifest (generated at build) and cache all assets listed
// //   try {
// //     const manifestResp = await fetch("/manifest.json", { cache: "no-store" });
// //     if (!manifestResp.ok) return;
// //     const manifest = await manifestResp.json();
// //     const assets = new Set();

// //     for (const key of Object.keys(manifest)) {
// //       const entry = manifest[key];
// //       if (entry.file) assets.add("/" + entry.file);
// //       if (entry.css) entry.css.forEach(c => assets.add("/" + c));
// //       if (entry.assets) entry.assets.forEach(a => assets.add("/" + a));
// //     }

// //     for (const url of assets) {
// //       try {
// //         await cache.add(url);
// //         console.log("[SW] Cached asset:", url);
// //       } catch (e) {
// //         console.warn("[SW] Failed to cache", url, e);
// //       }
// //     }
// //   } catch (e) {
// //     console.warn("[SW] manifest fetch failed", e);
// //   }
// // }

// // self.addEventListener("install", (e) => {
// //   console.log("[SW] install");
// //   self.skipWaiting();
// //   e.waitUntil(precache());
// // });

// // self.addEventListener("activate", (e) => {
// //   console.log("[SW] activate");
// //   e.waitUntil(
// //     caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))))
// //   );
// //   self.clients.claim();
// // });

// // self.addEventListener("fetch", (event) => {
// //   const req = event.request;

// //   // ignore chrome-extension and dev server websockets
// //   if (req.url.startsWith("chrome-extension://") || req.url.includes("__vite") || req.url.includes("/sockjs/")) {
// //     return;
// //   }

// //   event.respondWith(
// //     caches.match(req).then(cached => {
// //       if (cached) return cached;
// //       return fetch(req)
// //         .then(resp => {
// //           // cache dynamic files
// //           const clone = resp.clone();
// //           caches.open(CACHE_NAME).then(cache => {
// //             // only cache GET + 200 responses
// //             if (req.method === "GET" && resp.ok) cache.put(req, clone);
// //           });
// //           return resp;
// //         }).catch(() => {
// //           if (req.mode === "navigate") {
// //             return caches.match("/index.html");
// //           }
// //         });
// //     })
// //   );
// // });

// // public/sw.js

// const CACHE_VERSION = "v2.0.1"; // Bump this on every release
// const CACHE_NAME = `blt-cache-${CACHE_VERSION}`;

// // Assets to cache immediately on install
// const CORE_ASSETS = [
//   "/",
//   "/index.html",
//   "/manifest.json"
// ];

// // URLs that should always be fetched from network
// const NETWORK_FIRST = [
//   "/api/",
//   "http://localhost:5984/",
//   "https://*.couchdb.com/"
// ];

// // URLs that can be cached and served stale-while-revalidate
// const CACHE_FIRST = [
//   "/src/",
//   "/assets/",
//   "/icons/",
//   ".js",
//   ".css",
//   ".png",
//   ".jpg",
//   ".svg",
//   ".woff",
//   ".woff2"
// ];

// /* =========================================
//    INSTALLATION
// ========================================= */

// self.addEventListener("install", (event) => {
//   console.log("[SW] Installing version:", CACHE_VERSION);

//   event.waitUntil(
//     (async () => {
//       try {
//         const cache = await caches.open(CACHE_NAME);
        
//         // Cache core assets
//         await cache.addAll(CORE_ASSETS);
//         console.log("[SW] Core assets cached");

//         // Try to cache additional assets from manifest
//         await cacheManifestAssets(cache);

//         // Skip waiting to activate immediately
//         await self.skipWaiting();
//         console.log("[SW] Installation complete");
//       } catch (error) {
//         console.error("[SW] Installation error:", error);
//       }
//     })()
//   );
// });

// async function cacheManifestAssets(cache) {
//   try {
//     // Fetch Vite's manifest.json (if using Vite build)
//     const manifestResp = await fetch("/.vite/manifest.json", {
//       cache: "no-store"
//     });

//     if (!manifestResp.ok) return;

//     const manifest = await manifestResp.json();
//     const assets = new Set();

//     // Extract all asset URLs from manifest
//     for (const key of Object.keys(manifest)) {
//       const entry = manifest[key];
//       if (entry.file) assets.add("/" + entry.file);
//       if (entry.css) entry.css.forEach(c => assets.add("/" + c));
//       if (entry.assets) entry.assets.forEach(a => assets.add("/" + a));
//     }

//     // Cache each asset individually (don't fail if one fails)
//     for (const url of assets) {
//       try {
//         await cache.add(url);
//         console.log("[SW] Cached:", url);
//       } catch (e) {
//         console.warn("[SW] Failed to cache:", url);
//       }
//     }
//   } catch (error) {
//     console.warn("[SW] Manifest caching failed:", error);
//   }
// }

// /* =========================================
//    ACTIVATION
// ========================================= */

// self.addEventListener("activate", (event) => {
//   console.log("[SW] Activating version:", CACHE_VERSION);

//   event.waitUntil(
//     (async () => {
//       try {
//         // Delete old caches
//         const cacheNames = await caches.keys();
//         await Promise.all(
//           cacheNames.map(name => {
//             if (name !== CACHE_NAME) {
//               console.log("[SW] Deleting old cache:", name);
//               return caches.delete(name);
//             }
//           })
//         );

//         // Take control of all clients immediately
//         await self.clients.claim();
//         console.log("[SW] Activation complete");

//         // Notify all clients about the update
//         notifyClients({ type: "SW_ACTIVATED", version: CACHE_VERSION });
//       } catch (error) {
//         console.error("[SW] Activation error:", error);
//       }
//     })()
//   );
// });

// /* =========================================
//    FETCH HANDLING
// ========================================= */

// self.addEventListener("fetch", (event) => {
//   const { request } = event;
//   const url = new URL(request.url);

//   // Ignore non-http(s) requests
//   if (!url.protocol.startsWith("http")) {
//     return;
//   }

//   // Ignore dev server and extensions
//   if (shouldIgnoreRequest(request)) {
//     return;
//   }

//   // Choose strategy based on request type
//   if (shouldUseNetworkFirst(request)) {
//     event.respondWith(networkFirst(request));
//   } else if (shouldUseCacheFirst(request)) {
//     event.respondWith(cacheFirst(request));
//   } else {
//     event.respondWith(staleWhileRevalidate(request));
//   }
// });

// // function shouldIgnoreRequest(request) {
// //   const url = request.url;
// //   return (
// //     url.includes("chrome-extension://") ||
// //     url.includes("__vite") ||
// //     url.includes("/sockjs/") ||
// //     url.includes("/@vite/") ||
// //     url.includes("/@fs/") ||
// //     url.includes("hot-update")
// //   );
// // }

// // public/sw.js

// function shouldIgnoreRequest(request) {
//   const url = request.url;
//   return (
//     url.includes("chrome-extension://") ||
//     url.includes("__vite") ||
//     url.includes("/sockjs/") ||
//     url.includes("/@vite/") ||
//     url.includes("/@fs/") ||
//     url.includes("hot-update") ||
//     // ✅ ADD THIS LINE - Ignore CouchDB requests
//     url.includes("localhost:5984") ||
//     url.includes(":5984")
//   );
// }

// function shouldUseNetworkFirst(request) {
//   const url = request.url;
//   return NETWORK_FIRST.some(pattern => url.includes(pattern));
// }

// function shouldUseCacheFirst(request) {
//   const url = request.url;
//   return CACHE_FIRST.some(pattern => url.includes(pattern));
// }

// /* =========================================
//    CACHING STRATEGIES
// ========================================= */

// // Network First: Try network, fall back to cache
// async function networkFirst(request) {
//   try {
//     const networkResponse = await fetch(request);
    
//     // Cache successful responses
//     if (networkResponse.ok) {
//       const cache = await caches.open(CACHE_NAME);
//       cache.put(request, networkResponse.clone());
//     }
    
//     return networkResponse;
//   } catch (error) {
//     console.log("[SW] Network failed, trying cache:", request.url);
//     const cachedResponse = await caches.match(request);
    
//     if (cachedResponse) {
//       return cachedResponse;
//     }
    
//     // Return offline page for navigation requests
//     if (request.mode === "navigate") {
//       const cache = await caches.open(CACHE_NAME);
//       return cache.match("/index.html") || new Response("Offline", {
//         status: 503,
//         statusText: "Service Unavailable"
//       });
//     }
    
//     throw error;
//   }
// }

// // Cache First: Use cache, fall back to network
// async function cacheFirst(request) {
//   const cachedResponse = await caches.match(request);
  
//   if (cachedResponse) {
//     return cachedResponse;
//   }
  
//   try {
//     const networkResponse = await fetch(request);
    
//     if (networkResponse.ok) {
//       const cache = await caches.open(CACHE_NAME);
//       cache.put(request, networkResponse.clone());
//     }
    
//     return networkResponse;
//   } catch (error) {
//     console.error("[SW] Cache and network failed:", request.url);
    
//     // Return offline fallback for navigation
//     if (request.mode === "navigate") {
//       const cache = await caches.open(CACHE_NAME);
//       return cache.match("/index.html") || new Response("Offline", {
//         status: 503,
//         statusText: "Service Unavailable"
//       });
//     }
    
//     throw error;
//   }
// }

// // Stale While Revalidate: Return cache immediately, update in background
// async function staleWhileRevalidate(request) {
//   const cache = await caches.open(CACHE_NAME);
//   const cachedResponse = await cache.match(request);
  
//   const fetchPromise = fetch(request)
//     .then(networkResponse => {
//       if (networkResponse.ok) {
//         cache.put(request, networkResponse.clone());
//       }
//       return networkResponse;
//     })
//     .catch(error => {
//       console.warn("[SW] Background fetch failed:", request.url);
//       return cachedResponse || new Response("Offline", {
//         status: 503,
//         statusText: "Service Unavailable"
//       });
//     });
  
//   // Return cached response immediately if available
//   return cachedResponse || fetchPromise;
// }

// /* =========================================
//    BACKGROUND SYNC
// ========================================= */

// self.addEventListener("sync", (event) => {
//   console.log("[SW] Background sync:", event.tag);

//   if (event.tag === "sync-reports") {
//     event.waitUntil(syncReports());
//   }
// });

// async function syncReports() {
//   try {
//     console.log("[SW] Syncing reports in background...");
    
//     // Notify clients to perform sync
//     notifyClients({ type: "BACKGROUND_SYNC", tag: "sync-reports" });
    
//     return true;
//   } catch (error) {
//     console.error("[SW] Background sync failed:", error);
//     throw error;
//   }
// }

// /* =========================================
//    PUSH NOTIFICATIONS
// ========================================= */

// self.addEventListener("push", (event) => {
//   const data = event.data ? event.data.json() : {};
  
//   console.log("[SW] Push notification received:", data);

//   const options = {
//     body: data.body || "You have a new notification",
//     icon: "/icons/icon-192.png",
//     badge: "/icons/icon-192.png",
//     data: data.url || "/",
//     actions: [
//       { action: "open", title: "Open" },
//       { action: "close", title: "Close" }
//     ]
//   };

//   event.waitUntil(
//     self.registration.showNotification(data.title || "BLT Notification", options)
//   );
// });

// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();

//   if (event.action === "open" || !event.action) {
//     const urlToOpen = event.notification.data || "/";
    
//     event.waitUntil(
//       clients.matchAll({ type: "window" }).then(clientList => {
//         // Check if there's already a window open
//         for (const client of clientList) {
//           if (client.url === urlToOpen && "focus" in client) {
//             return client.focus();
//           }
//         }
        
//         // Open a new window
//         if (clients.openWindow) {
//           return clients.openWindow(urlToOpen);
//         }
//       })
//     );
//   }
// });

// /* =========================================
//    MESSAGES FROM CLIENTS
// ========================================= */

// self.addEventListener("message", (event) => {
//   console.log("[SW] Message received:", event.data);

//   if (event.data.type === "SKIP_WAITING") {
//     self.skipWaiting();
//   }

//   if (event.data.type === "GET_VERSION") {
//     event.ports[0].postMessage({ version: CACHE_VERSION });
//   }

//   if (event.data.type === "CLEAR_CACHE") {
//     event.waitUntil(
//       caches.delete(CACHE_NAME).then(() => {
//         event.ports[0].postMessage({ success: true });
//       })
//     );
//   }
// });

// /* =========================================
//    UTILITIES
// ========================================= */

// async function notifyClients(message) {
//   const clients = await self.clients.matchAll({ type: "window" });
  
//   for (const client of clients) {
//     client.postMessage(message);
//   }
// }

// /* =========================================
//    ERROR HANDLING
// ========================================= */

// self.addEventListener("error", (event) => {
//   console.error("[SW] Error:", event.error);
// });

// self.addEventListener("unhandledrejection", (event) => {
//   console.error("[SW] Unhandled rejection:", event.reason);
// });

// console.log("[SW] Service Worker loaded, version:", CACHE_VERSION);

// public/sw.js

const CACHE_VERSION = "v2.0.1"; // Bump this on every release
const CACHE_NAME = `blt-cache-${CACHE_VERSION}`;

// Assets to cache immediately on install
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

// URLs that should always be fetched from network (never cache)
const NETWORK_ONLY = [
  "localhost:42080",      // ✅ BLT Agent API
  "127.0.0.1:42080",     // ✅ BLT Agent API (alternative)
  "localhost:5984",      // ✅ CouchDB
  "127.0.0.1:5984",      // ✅ CouchDB (alternative)
  "/api/",               // ✅ Backend API calls
  "/_changes",           // ✅ CouchDB change feeds
  "/db/"                 // ✅ CouchDB database calls
];

// URLs that should use network first, cache as fallback
const NETWORK_FIRST = [
  "/manifest.json",
  "/version.json"
];

// URLs that can be cached and served stale-while-revalidate
const CACHE_FIRST = [
  "/src/",
  "/assets/",
  "/icons/",
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".svg",
  ".woff",
  ".woff2"
];

/* =========================================
   INSTALLATION
========================================= */

self.addEventListener("install", (event) => {
  console.log("[SW] Installing version:", CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache core assets
        await cache.addAll(CORE_ASSETS);
        console.log("[SW] Core assets cached");

        // Try to cache additional assets from manifest
        await cacheManifestAssets(cache);

        // Skip waiting to activate immediately
        await self.skipWaiting();
        console.log("[SW] Installation complete");
      } catch (error) {
        console.error("[SW] Installation error:", error);
      }
    })()
  );
});

async function cacheManifestAssets(cache) {
  try {
    // Fetch Vite's manifest.json (if using Vite build)
    const manifestResp = await fetch("/.vite/manifest.json", {
      cache: "no-store"
    });

    if (!manifestResp.ok) return;

    const manifest = await manifestResp.json();
    const assets = new Set();

    // Extract all asset URLs from manifest
    for (const key of Object.keys(manifest)) {
      const entry = manifest[key];
      if (entry.file) assets.add("/" + entry.file);
      if (entry.css) entry.css.forEach(c => assets.add("/" + c));
      if (entry.assets) entry.assets.forEach(a => assets.add("/" + a));
    }

    // Cache each asset individually (don't fail if one fails)
    for (const url of assets) {
      try {
        await cache.add(url);
        console.log("[SW] Cached:", url);
      } catch (e) {
        console.warn("[SW] Failed to cache:", url);
      }
    }
  } catch (error) {
    console.warn("[SW] Manifest caching failed:", error);
  }
}

/* =========================================
   ACTIVATION
========================================= */

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating version:", CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Delete old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => {
            if (name !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }
          })
        );

        // Take control of all clients immediately
        await self.clients.claim();
        console.log("[SW] Activation complete");

        // Notify all clients about the update
        notifyClients({ type: "SW_ACTIVATED", version: CACHE_VERSION });
      } catch (error) {
        console.error("[SW] Activation error:", error);
      }
    })()
  );
});

/* =========================================
   FETCH HANDLING
========================================= */

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // ✅ CRITICAL: Bypass agent and database calls (never cache)
  if (shouldBypassCache(request)) {
    console.log("[SW] Bypassing cache for:", request.url);
    event.respondWith(fetch(request));
    return;
  }

  // Ignore dev server and extensions
  if (shouldIgnoreRequest(request)) {
    return;
  }

  // Choose strategy based on request type
  if (shouldUseNetworkFirst(request)) {
    event.respondWith(networkFirst(request));
  } else if (shouldUseCacheFirst(request)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// ✅ NEW: Check if request should bypass cache entirely
function shouldBypassCache(request) {
  const url = request.url;
  return NETWORK_ONLY.some(pattern => url.includes(pattern));
}

function shouldIgnoreRequest(request) {
  const url = request.url;
  return (
    url.includes("chrome-extension://") ||
    url.includes("__vite") ||
    url.includes("/sockjs/") ||
    url.includes("/@vite/") ||
    url.includes("/@fs/") ||
    url.includes("hot-update")
  );
}

function shouldUseNetworkFirst(request) {
  const url = request.url;
  return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

function shouldUseCacheFirst(request) {
  const url = request.url;
  return CACHE_FIRST.some(pattern => url.includes(pattern));
}

/* =========================================
   CACHING STRATEGIES
========================================= */

// Network First: Try network, fall back to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // ✅ Return offline page for navigation requests
    if (request.mode === "navigate") {
      return handleOfflineNavigation();
    }
    
    throw error;
  }
}

// Cache First: Use cache, fall back to network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache and network failed:", request.url);
    
    // ✅ Return offline fallback for navigation
    if (request.mode === "navigate") {
      return handleOfflineNavigation();
    }
    
    throw error;
  }
}

// Stale While Revalidate: Return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.warn("[SW] Background fetch failed:", request.url);
      
      // ✅ Handle navigation failures
      if (request.mode === "navigate" && !cachedResponse) {
        return handleOfflineNavigation();
      }
      
      return cachedResponse || new Response("Offline", {
        status: 503,
        statusText: "Service Unavailable"
      });
    });
  
  // Return cached response immediately if available
  return cachedResponse || fetchPromise;
}

// ✅ NEW: Handle offline navigation requests
async function handleOfflineNavigation() {
  const cache = await caches.open(CACHE_NAME);
  
  // Try to serve cached index.html
  const cachedIndex = await cache.match("/index.html");
  if (cachedIndex) {
    console.log("[SW] Serving cached index.html for offline navigation");
    return cachedIndex;
  }
  
  // Try to serve cached root
  const cachedRoot = await cache.match("/");
  if (cachedRoot) {
    console.log("[SW] Serving cached root for offline navigation");
    return cachedRoot;
  }
  
  // Last resort: return offline message
  console.warn("[SW] No cached content available for offline navigation");
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>BLT - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        h1 { font-size: 48px; margin: 0 0 20px 0; }
        p { font-size: 18px; opacity: 0.9; }
        button {
          margin-top: 30px;
          padding: 12px 30px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div>
        <h1>📴</h1>
        <h2>BLT is Offline</h2>
        <p>The app is working in offline mode.</p>
        <p>Your data is safe and will sync when you're back online.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" }
    }
  );
}

/* =========================================
   BACKGROUND SYNC
========================================= */

self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-reports") {
    event.waitUntil(syncReports());
  }
});

async function syncReports() {
  try {
    console.log("[SW] Syncing reports in background...");
    
    // Notify clients to perform sync
    notifyClients({ type: "BACKGROUND_SYNC", tag: "sync-reports" });
    
    return true;
  } catch (error) {
    console.error("[SW] Background sync failed:", error);
    throw error;
  }
}

/* =========================================
   PUSH NOTIFICATIONS
========================================= */

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  
  console.log("[SW] Push notification received:", data);

  const options = {
    body: data.body || "You have a new notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: data.url || "/",
    actions: [
      { action: "open", title: "Open" },
      { action: "close", title: "Close" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "BLT Notification", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    const urlToOpen = event.notification.data || "/";
    
    event.waitUntil(
      clients.matchAll({ type: "window" }).then(clientList => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        
        // Open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

/* =========================================
   MESSAGES FROM CLIENTS
========================================= */

self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

/* =========================================
   UTILITIES
========================================= */

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: "window" });
  
  for (const client of clients) {
    client.postMessage(message);
  }
}

/* =========================================
   ERROR HANDLING
========================================= */

self.addEventListener("error", (event) => {
  console.error("[SW] Error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled rejection:", event.reason);
});

console.log("[SW] Service Worker loaded, version:", CACHE_VERSION);
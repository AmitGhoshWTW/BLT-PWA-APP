// electron/main.cjs
const { app, BrowserWindow, ipcMain, desktopCapturer, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let currentZoomLevel = 0; // Track zoom level (-8 to +8)

function createWindow() {
  console.log('[Electron] Creating window...');
  console.log('[Electron] __dirname:', __dirname);
  console.log('[Electron] isPackaged:', app.isPackaged);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    },
    title: 'BLT - Bug Logging Tool',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] Window ready to show');
    mainWindow.show();
  });

  // Load app
  if (app.isPackaged) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('[Electron] Loading production build from:', indexPath);
    console.log('[Electron] File exists:', fs.existsSync(indexPath));
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('[Electron] ERROR: index.html not found at:', indexPath);
      const altPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');
      console.log('[Electron] Trying alternative path:', altPath);
      mainWindow.loadFile(altPath);
    }
  } else {
    console.log('[Electron] Loading dev server: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] ✅ Page loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[Electron] ❌ Failed to load:', {
      errorCode,
      errorDescription,
      url: validatedURL
    });
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });

  // Handle zoom level changes from browser
  mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
    if (zoomDirection === 'in') {
      zoomIn();
    } else if (zoomDirection === 'out') {
      zoomOut();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu with zoom controls
  createMenu();
}

// ============================================
// ZOOM FUNCTIONS
// ============================================

function zoomIn() {
  if (currentZoomLevel < 8) {
    currentZoomLevel++;
    applyZoom();
  }
}

function zoomOut() {
  if (currentZoomLevel > -8) {
    currentZoomLevel--;
    applyZoom();
  }
}

function zoomReset() {
  currentZoomLevel = 0;
  applyZoom();
}

function applyZoom() {
  if (mainWindow && mainWindow.webContents) {
    // Convert zoom level to zoom factor
    // Level 0 = 100%, Level 1 = 110%, Level -1 = 90%
    const zoomFactor = Math.pow(1.1, currentZoomLevel);
    
    mainWindow.webContents.setZoomFactor(zoomFactor);
    
    const percentage = Math.round(zoomFactor * 100);
    console.log(`[Electron] Zoom: ${percentage}% (Level: ${currentZoomLevel})`);
    
    // Update title bar with zoom level
    const baseTitle = 'BLT - Bug Logging Tool';
    if (percentage !== 100) {
      mainWindow.setTitle(`${baseTitle} (${percentage}%)`);
    } else {
      mainWindow.setTitle(baseTitle);
    }
  }
}

// ============================================
// MENU CREATION
// ============================================

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Report',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('new-report');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reload();
            }
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: zoomIn
        },
        {
          label: 'Zoom In (Numpad)',
          accelerator: 'CmdOrCtrl+=',
          visible: false,
          acceleratorWorksWhenHidden: true,
          click: zoomIn
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: zoomOut
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: zoomReset
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About BLT',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Bug Logging Tool',
              message: 'Bug Logging Tool v2.0',
              detail: 'Desktop application for bug reporting with screenshot capture and offline support.\n\n' +
                      'Features:\n' +
                      '• Screenshot capture with annotations\n' +
                      '• Offline-first architecture\n' +
                      '• Automatic log file collection\n' +
                      '• CouchDB synchronization',
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Keyboard Shortcuts',
              message: 'BLT Keyboard Shortcuts',
              detail: 'File:\n' +
                      '  Ctrl+N - New Report\n' +
                      '  Ctrl+Q - Exit\n\n' +
                      'View:\n' +
                      '  Ctrl+R - Reload\n' +
                      '  Ctrl+Shift+R - Force Reload\n' +
                      '  Ctrl++ - Zoom In\n' +
                      '  Ctrl+- - Zoom Out\n' +
                      '  Ctrl+0 - Reset Zoom\n' +
                      '  Ctrl+Shift+I - Developer Tools\n' +
                      '  F11 - Toggle Fullscreen',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  // Add macOS-specific menu items
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu (macOS)
    template[4].submenu = [
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
      { type: 'separator' },
      { role: 'window' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(() => {
  console.log('[Electron] App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('[Electron] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[Electron] App activated');
  if (mainWindow === null) {
    createWindow();
  }
});

// ============================================
// IPC HANDLERS
// ============================================

// Get screen sources (EXISTING)
ipcMain.handle('get-screen-sources', async (event) => {
  try {
    console.log('[Electron] Getting screen sources...');
    
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 150, height: 150 }
    });
    
    console.log('[Electron] Found', sources.length, 'sources');
    
    // Convert sources to plain objects (remove NativeImage)
    const plainSources = sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id,
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }));
    
    return plainSources;
  } catch (error) {
    console.error('[Electron] Error getting sources:', error);
    throw error;
  }
});

// Read log file (EXISTING)
ipcMain.handle('read-log-file', async (event, logPath) => {
  try {
    console.log('[Electron] Reading log file:', logPath);
    const expandedPath = expandPath(logPath);
    
    if (!fs.existsSync(expandedPath)) {
      throw new Error(`File not found: ${expandedPath}`);
    }

    const content = fs.readFileSync(expandedPath, 'utf-8');
    const stats = fs.statSync(expandedPath);
    const filename = path.basename(expandedPath);

    console.log('[Electron] ✅ Log file read successfully:', filename);

    return {
      success: true,
      content,
      filename,
      size: stats.size,
      lastModified: stats.mtimeMs
    };
  } catch (error) {
    console.error('[Electron] ❌ Error reading log file:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Test path (EXISTING)
ipcMain.handle('test-path', async (event, pathStr) => {
  try {
    const expandedPath = expandPath(pathStr);
    const exists = fs.existsSync(expandedPath);
    console.log('[Electron] Path test:', pathStr, '→', exists);
    return exists;
  } catch (e) {
    console.error('[Electron] Error testing path:', e);
    return false;
  }
});

// NEW: Zoom control handlers
ipcMain.on('zoom-in', () => {
  zoomIn();
});

ipcMain.on('zoom-out', () => {
  zoomOut();
});

ipcMain.on('zoom-reset', () => {
  zoomReset();
});

ipcMain.handle('get-zoom-level', () => {
  return {
    level: currentZoomLevel,
    factor: Math.pow(1.1, currentZoomLevel),
    percentage: Math.round(Math.pow(1.1, currentZoomLevel) * 100)
  };
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function expandPath(pathStr) {
  const homeDir = os.homedir();
  const username = os.userInfo().username;

  let expanded = pathStr
    .replace(/^~/, homeDir)
    .replace(/%USERPROFILE%/gi, homeDir)
    .replace(/%USERNAME%/gi, username)
    .replace(/\$HOME/gi, homeDir);

  return path.normalize(expanded);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Electron] Unhandled rejection:', reason);
});

console.log('[Electron] Main process initialized');
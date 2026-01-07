// electron/preload.cjs
// require("electron").webFrame.setZoomFactor(1);
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Starting preload script...');

contextBridge.exposeInMainWorld('electronAPI', {
  // File system access
  readLogFile: (logPath) => {
    console.log('[Preload] readLogFile called:', logPath);
    return ipcRenderer.invoke('read-log-file', logPath);
  },
  
  testPath: (pathStr) => {
    console.log('[Preload] testPath called:', pathStr);
    return ipcRenderer.invoke('test-path', pathStr);
  },
  
  // Screen capture - CALLS MAIN PROCESS
  getScreenSources: () => {
    console.log('[Preload] Requesting screen sources from main process...');
    return ipcRenderer.invoke('get-screen-sources');
  },

  // Zoom control API
  zoomIn: () => ipcRenderer.send('zoom-in'),
  zoomOut: () => ipcRenderer.send('zoom-out'),
  zoomReset: () => ipcRenderer.send('zoom-reset'),
  getZoomLevel: () => ipcRenderer.invoke('get-zoom-level'),
  
  // Platform detection
  isElectron: true,
  platform: process.platform,

  // Event listeners
  onNewReport: (callback) => {
    ipcRenderer.on('new-report', callback);
  },
  
  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

console.log('[Preload] ✅ Electron API exposed successfully');
console.log('[Preload] Platform:', process.platform);
console.log('[Preload] Node:', process.versions.node);
console.log('[Preload] Electron:', process.versions.electron);
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 42080;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://blt.company.com'],
  credentials: true
}));

app.use(express.json());

// Agent info
const AGENT_VERSION = '1.0.0';
const AGENT_NAME = 'BLT Agent';

// Default log file paths (configurable)
let logPaths = [
  path.join(os.homedir(), 'AppData', 'Local', 'Palo Alto Networks', 'GlobalProtect', 'PanGPS.log'),
  path.join(os.homedir(), 'AppData', 'Local', 'Palo Alto Networks', 'GlobalProtect', 'PanGPA.log'),
  'C:\\Program Files\\Palo Alto Networks\\GlobalProtect\\PanGPS.log'
];

// Load custom paths from config
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.logPaths) {
      logPaths = config.logPaths;
    }
  } catch (err) {
    console.error('[Agent] Failed to load config:', err);
  }
}

console.log(`[${AGENT_NAME}] Starting...`);
console.log(`[${AGENT_NAME}] Version: ${AGENT_VERSION}`);
console.log(`[${AGENT_NAME}] Port: ${PORT}`);
console.log(`[${AGENT_NAME}] Monitoring paths:`, logPaths);

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: AGENT_NAME,
    version: AGENT_VERSION,
    timestamp: Date.now()
  });
});

// Get agent info
app.get('/api/info', (req, res) => {
  res.json({
    name: AGENT_NAME,
    version: AGENT_VERSION,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    username: os.userInfo().username,
    monitoredPaths: logPaths
  });
});

// Get configured log paths
app.get('/api/log-paths', (req, res) => {
  const pathsWithStatus = logPaths.map(logPath => {
    const expanded = expandPath(logPath);
    return {
      path: logPath,
      expandedPath: expanded,
      exists: fs.existsSync(expanded),
      readable: fs.existsSync(expanded) && checkReadable(expanded)
    };
  });

  res.json({
    paths: pathsWithStatus
  });
});

// Add custom log path
app.post('/api/log-paths', (req, res) => {
  const { path: newPath } = req.body;
  
  if (!newPath) {
    return res.status(400).json({ error: 'Path is required' });
  }

  if (!logPaths.includes(newPath)) {
    logPaths.push(newPath);
    saveConfig();
    res.json({ success: true, paths: logPaths });
  } else {
    res.status(409).json({ error: 'Path already exists' });
  }
});

// Remove log path
app.delete('/api/log-paths', (req, res) => {
  const { path: pathToRemove } = req.body;
  
  const index = logPaths.indexOf(pathToRemove);
  if (index > -1) {
    logPaths.splice(index, 1);
    saveConfig();
    res.json({ success: true, paths: logPaths });
  } else {
    res.status(404).json({ error: 'Path not found' });
  }
});

// Collect log files
app.get('/api/collect-logs', async (req, res) => {
  try {
    const collectedFiles = [];
    const errors = [];

    for (const logPath of logPaths) {
      try {
        const expanded = expandPath(logPath);
        
        if (!fs.existsSync(expanded)) {
          errors.push({
            path: logPath,
            error: 'File not found'
          });
          continue;
        }

        const content = fs.readFileSync(expanded, 'utf-8');
        const stats = fs.statSync(expanded);

        collectedFiles.push({
          originalPath: logPath,
          expandedPath: expanded,
          filename: path.basename(expanded),
          content: content,
          size: stats.size,
          lastModified: stats.mtimeMs,
          collectedAt: Date.now()
        });

        console.log(`[${AGENT_NAME}] ✅ Collected: ${expanded}`);
      } catch (err) {
        console.error(`[${AGENT_NAME}] ❌ Error reading ${logPath}:`, err.message);
        errors.push({
          path: logPath,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      collected: collectedFiles.length,
      files: collectedFiles,
      errors: errors
    });
  } catch (err) {
    console.error(`[${AGENT_NAME}] Collection error:`, err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Test specific path
app.post('/api/test-path', (req, res) => {
  const { path: testPath } = req.body;
  
  if (!testPath) {
    return res.status(400).json({ error: 'Path is required' });
  }

  try {
    const expanded = expandPath(testPath);
    const exists = fs.existsSync(expanded);
    
    let stats = null;
    let readable = false;
    
    if (exists) {
      stats = fs.statSync(expanded);
      readable = checkReadable(expanded);
    }

    res.json({
      path: testPath,
      expandedPath: expanded,
      exists,
      readable,
      isFile: stats ? stats.isFile() : false,
      isDirectory: stats ? stats.isDirectory() : false,
      size: stats ? stats.size : 0,
      lastModified: stats ? stats.mtimeMs : null
    });
  } catch (err) {
    res.json({
      path: testPath,
      exists: false,
      error: err.message
    });
  }
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
    .replace(/\$HOME/gi, homeDir)
    .replace(/%APPDATA%/gi, path.join(homeDir, 'AppData', 'Roaming'))
    .replace(/%LOCALAPPDATA%/gi, path.join(homeDir, 'AppData', 'Local'));

  return path.normalize(expanded);
}

function checkReadable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function saveConfig() {
  try {
    const config = { logPaths };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`[${AGENT_NAME}] Config saved`);
  } catch (err) {
    console.error(`[${AGENT_NAME}] Failed to save config:`, err);
  }
}

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, 'localhost', () => {
  console.log(`[${AGENT_NAME}] ✅ Agent running on http://localhost:${PORT}`);
  console.log(`[${AGENT_NAME}] Ready to serve log files`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n[${AGENT_NAME}] Shutting down...`);
  server.close(() => {
    console.log(`[${AGENT_NAME}] Server closed`);
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error(`[${AGENT_NAME}] Uncaught exception:`, err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${AGENT_NAME}] Unhandled rejection:`, reason);
});
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startActivityDetection } = require('./activity/activityDetector');
const workSessionApi = require('./api/workSessionApi');
const agentApi = require('./api/agentApi');
const config = require('./config');

const fs = require('fs');
const LOG_FILE = path.join(__dirname, 'agent-debug.log');
function logDebug(msg) {
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
    console.log(msg);
  } catch(e) {}
}

process.on('uncaughtException', (error) => {
  logDebug(`[Agent] Uncaught Exception: ${error.message}\n${error.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logDebug(`[Agent] Unhandled Rejection at: ${promise} reason: ${reason}`);
});

logDebug(`[Agent] Electron starting with argv: ${process.argv.map(a => a.startsWith('employee-track') ? 'employee-track://[REDACTED]' : a).join(' | ')}`);


let mainWindow;
let hasActiveSession = false;
let lastKnownStatus = 'active';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

function sendToUI(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

// -----------------------------------------------------------------
// Sync Logic
// -----------------------------------------------------------------
async function checkCurrentSession() {
  try {
    const response = await workSessionApi.getCurrentSession(config.DEVELOPMENT_JWT);
    
    // TEMPORARY DIAGNOSTIC LOGGING
    console.log('[DEBUG] checkCurrentSession:');
    console.log('  Token exists:', !!config.DEVELOPMENT_JWT);
    console.log('  Token length:', config.DEVELOPMENT_JWT ? config.DEVELOPMENT_JWT.length : 0);
    console.log('  HTTP Status:', response.statusCode);
    console.log('  Success:', response.data?.success);
    console.log('  Session ID:', response.data?.session?._id);
    console.log('  [DEBUG] Raw GET response:', JSON.stringify(response.data));

    if (response.statusCode === 401 || response.statusCode === 403) {
      throw new Error('Authentication Required');
    }
    if (response.statusCode >= 500) {
      throw new Error(`Backend Error ${response.statusCode}`);
    }

    sendToUI('connection-update', 'Connected');

    if (
      response.statusCode === 200 &&
      response.data &&
      response.data.success &&
      response.data.session
    ) {
      hasActiveSession = true;
      sendToUI('session-update', 'Active');
    } else {
      hasActiveSession = false;
      sendToUI('session-update', 'No Active Work Session');
    }
  } catch (err) {
    hasActiveSession = false;
    const safeMsg = err.message.includes('ECONNREFUSED') ? 'Backend unavailable' : err.message;
    sendToUI('session-update', 'No Active Work Session');
    sendToUI('connection-update', safeMsg);
  }
}

async function syncActivityStatus(status) {
  if (!hasActiveSession) return;
  
  try {
    const res = await workSessionApi.sendActivityStatus(config.DEVELOPMENT_JWT, status);
    if (res.statusCode !== 200) {
      throw new Error(res.data?.message || `Sync failed with status ${res.statusCode}`);
    }
    sendToUI('connection-update', 'Connected');
    sendToUI('sync-update', `Last synced: ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    const safeMsg = err.message.includes('ECONNREFUSED') ? 'Backend unavailable' : err.message;
    sendToUI('connection-update', safeMsg);
    sendToUI('sync-update', `Sync failed: ${safeMsg}`);
  }
}

// -----------------------------------------------------------------
// Protocol & Single Instance Lock
// -----------------------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock();
logDebug(`[Agent] gotTheLock = ${gotTheLock}`);

let isProtocolInstance = false;
if (process.platform === 'win32' || process.platform === 'linux') {
  const url = process.argv.length > 1 ? process.argv[process.argv.length - 1] : null;
  if (url && url.startsWith('employee-track://')) {
    isProtocolInstance = true;
  }
}

if (!gotTheLock && !isProtocolInstance) {
  logDebug('[Agent] Single instance lock not acquired and no protocol args. Exiting.');
  app.quit();
} else if (gotTheLock) {
  logDebug('[Agent] Single instance lock acquired.');
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    logDebug(`[Agent] second-instance fired: ${commandLine.join(' | ')}`);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    
    // Windows/Linux protocol handler
    const url = commandLine.pop();
    logDebug(`[Agent] Protocol received (second-instance): ${url?.substring(0, 25)}`);
    handleProtocol(url);
  });
}

// macOS protocol handler
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('[Agent] Protocol received (open-url)', url?.substring(0, 25));
  handleProtocol(url);
});

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('employee-track', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('employee-track');
}

async function handleProtocol(url) {
  if (typeof url !== 'string') return;
  url = url.replace(/"/g, '').replace(/'/g, ''); // Strip quotes added by OS
  if (!url.startsWith('employee-track://connect')) {
    return;
  }
  
  try {
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get('code');
    
    if (code) {
      logDebug('[Agent] Pairing request sent');
      sendToUI('connection-update', 'Pairing...');
      const res = await agentApi.pairAgent(code);
      if (res.statusCode === 200 && res.data?.success && res.data?.agentToken) {
        logDebug('[Agent] Pairing successful');
        config.saveToken(res.data.agentToken);
        sendToUI('connection-update', 'Paired successfully!');
        checkCurrentSession();
      } else {
        logDebug(`[Agent] Pairing failed: ${res.statusCode}`);
        sendToUI('connection-update', `Pairing failed: ${res.data?.message || res.statusCode}`);
      }
    }
  } catch (err) {
    logDebug(`[Agent] Protocol handler error: ${err.message}`);
  }
}

// -----------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------
app.whenReady().then(() => {
  logDebug('[Agent] app.whenReady fired');
  if (gotTheLock) {
    createWindow();
    logDebug('[Agent] createWindow called');
  }

  // Handle protocol if opened via CLI on Windows/Linux
  if (process.platform === 'win32' || process.platform === 'linux') {
    const url = process.argv.length > 1 ? process.argv[process.argv.length - 1] : null;
    if (url && url.startsWith('employee-track://')) {
        logDebug(`[Agent] Protocol received (CLI args): ${url.substring(0, 25)}`);
        handleProtocol(url).then(() => {
            if (!gotTheLock) {
                logDebug('[Agent] Protocol handled by second instance. Quitting now.');
                app.quit();
            }
        });
    } else if (!gotTheLock) {
        logDebug('[Agent] No protocol in CLI args for second instance. Quitting now.');
        app.quit();
    }
  } else if (!gotTheLock) {
    app.quit();
  }

  // Only run polling and activity tracking in the primary instance
  if (gotTheLock) {
    // 1. Session Polling (Every 15 seconds)
    checkCurrentSession();
    setInterval(checkCurrentSession, 15000);

    // 2. Activity Tracking (Local)
    const THRESHOLD = 300; 
    
    startActivityDetection(THRESHOLD, (status, lastActivityAt) => {
      if (hasActiveSession) {
        sendToUI('activity-update', { status, lastActivityAt });
        
        // If status CHANGED, push to backend immediately
        if (status !== lastKnownStatus) {
          lastKnownStatus = status;
          syncActivityStatus(status);
        }
      }
    });

    // 3. Periodic Activity Sync (Every 30 seconds)
    setInterval(() => {
      if (hasActiveSession) {
        syncActivityStatus(lastKnownStatus);
      }
    }, 30000);

    // 4. Periodic Heartbeat (Every 1 minute)
    setInterval(async () => {
      const token = config.DEVELOPMENT_JWT;
      if (token) {
        try {
          await agentApi.sendHeartbeat(token);
        } catch (err) {
          // Silent heartbeat fail
        }
      }
    }, 60000);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }
});

app.on('window-all-closed', () => {
  logDebug('[Agent] window-all-closed fired');
  if (process.platform !== 'darwin') {
    logDebug('[Agent] calling app.quit() due to window-all-closed');
    app.quit();
  }
});

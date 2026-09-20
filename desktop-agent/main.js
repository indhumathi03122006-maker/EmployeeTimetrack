const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startActivityDetection } = require('./activity/activityDetector');
const workSessionApi = require('./api/workSessionApi');
const config = require('./config');

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
// Initialization
// -----------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const appActivityApi = require('../api/appActivityApi');
const config = require('../config');

const LOG_FILE = path.join(__dirname, '..', 'agent-debug.log');
function logDebug(msg) {
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
    console.log(msg);
  } catch(e) {}
}

// Map process names to display names
const APP_NAME_MAP = {
  'code': 'VS Code',
  'chrome': 'Google Chrome',
  'msedge': 'Microsoft Edge',
  'firefox': 'Firefox',
  'devenv': 'Visual Studio',
  'teams': 'Teams',
  'ms-teams': 'Teams',
  'slack': 'Slack',
  'excel': 'Excel',
  'winword': 'Word',
  'powerpnt': 'PowerPoint',
  'outlook': 'Outlook',
  'notepad': 'Notepad',
  'notepad++': 'Notepad++',
  'cmd': 'Command Prompt',
  'powershell': 'PowerShell',
  'windowsterminal': 'Windows Terminal',
  'explorer': 'File Explorer',
  'spotify': 'Spotify',
  'electron': 'EmployeeTrack Agent'
};

function formatAppName(rawName) {
  if (!rawName) return null;
  let clean = String(rawName).trim().replace(/^\d+\s+/, '').trim();
  if (!clean) return null;
  const lower = clean.toLowerCase();
  if (APP_NAME_MAP[lower]) {
    return APP_NAME_MAP[lower];
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// PowerShell script to get foreground window process name using Base64 encoding
const psScript = `
$code = '[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow(); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);'
if (-not ([System.Management.Automation.PSTypeName]'Win32App').Type) {
    Add-Type -MemberDefinition $code -Name 'Win32App' -Namespace 'Win32Utils'
}
$hwnd = [Win32Utils.Win32App]::GetForegroundWindow()
$pidOut = 0
$ref = [ref]$pidOut
[Win32Utils.Win32App]::GetWindowThreadProcessId($hwnd, $ref)
if ($pidOut -gt 0) {
    (Get-Process -Id $pidOut).ProcessName
}
`;
const encodedPsScript = Buffer.from(psScript, 'utf16le').toString('base64');

function getActiveProcessName() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve(null);
    }

    exec(`powershell -NoProfile -EncodedCommand ${encodedPsScript}`, { timeout: 3000 }, (err, stdout) => {
      if (err || !stdout) {
        return resolve(null);
      }
      const rawName = stdout.trim();
      if (rawName) {
        return resolve(formatAppName(rawName));
      }
      resolve(null);
    });
  });
}

let activeInterval = null;
let currentAppRecord = null;
let isTracking = false;

function startAppTracking(getHasActiveSession, getStatus) {
  if (isTracking) return;
  isTracking = true;

  logDebug('[AppTracker] Started application tracking service');

  activeInterval = setInterval(async () => {
    try {
      const hasSession = typeof getHasActiveSession === 'function' ? getHasActiveSession() : false;
      const currentStatus = typeof getStatus === 'function' ? getStatus() : 'active';

      if (!hasSession || currentStatus === 'idle') {
        if (currentAppRecord) {
          await flushCurrentAppRecord();
        }
        return;
      }

      const appName = await getActiveProcessName();
      if (!appName) return;

      const now = new Date();

      if (!currentAppRecord) {
        logDebug(`[AppTracker] Focus started on: ${appName}`);
        currentAppRecord = {
          appName,
          startTime: now,
          lastSeen: now,
        };
      } else if (currentAppRecord.appName === appName) {
        currentAppRecord.lastSeen = now;

        // Flush chunk every 30 seconds of continuous use
        const durationSec = Math.round((now - currentAppRecord.startTime) / 1000);
        if (durationSec >= 30) {
          await flushCurrentAppRecord();
          currentAppRecord = {
            appName,
            startTime: now,
            lastSeen: now,
          };
        }
      } else {
        logDebug(`[AppTracker] App changed: ${currentAppRecord.appName} -> ${appName}`);
        await flushCurrentAppRecord();
        currentAppRecord = {
          appName,
          startTime: now,
          lastSeen: now,
        };
      }
    } catch (err) {
      logDebug(`[AppTracker] Error in tracking tick: ${err.message}`);
    }
  }, 5000);
}

async function flushCurrentAppRecord() {
  if (!currentAppRecord) return;
  const record = currentAppRecord;
  currentAppRecord = null;

  const token = config.DEVELOPMENT_JWT;
  if (!token) {
    logDebug('[AppTracker] Cannot flush record: No JWT token found');
    return;
  }

  const endTime = new Date();
  const startTime = record.startTime;
  const duration = Math.max(1, Math.round((endTime - startTime) / 1000));

  try {
    logDebug(`[AppTracker] Sending app activity to backend: ${record.appName} (${duration}s)`);
    const res = await appActivityApi.sendAppActivity(token, {
      appName: record.appName,
      startTime,
      endTime,
      duration,
    });
    logDebug(`[AppTracker] Backend response status: ${res.statusCode}`);
  } catch (err) {
    logDebug(`[AppTracker] Failed to send app activity: ${err.message}`);
  }
}

function stopAppTracking() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  flushCurrentAppRecord();
  isTracking = false;
  logDebug('[AppTracker] Stopped application tracking service');
}

module.exports = {
  startAppTracking,
  stopAppTracking,
  flushCurrentAppRecord,
};

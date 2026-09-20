const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onActivityUpdate: (callback) => ipcRenderer.on('activity-update', (_event, value) => callback(value)),
  onConnectionUpdate: (callback) => ipcRenderer.on('connection-update', (_event, value) => callback(value)),
  onSessionUpdate: (callback) => ipcRenderer.on('session-update', (_event, value) => callback(value)),
  onSyncUpdate: (callback) => ipcRenderer.on('sync-update', (_event, value) => callback(value))
});

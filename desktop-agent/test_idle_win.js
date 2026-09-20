const { app, BrowserWindow, powerMonitor } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 400, height: 350 });
  win.loadURL('about:blank');
  
  let count = 0;
  const interval = setInterval(() => {
    console.log(`[TEST-WIN] Raw system idle seconds: ${powerMonitor.getSystemIdleTime()}`);
    count++;
    if (count >= 10) {
      clearInterval(interval);
      app.quit();
    }
  }, 1000);
});

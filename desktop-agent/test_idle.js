const { app, powerMonitor } = require('electron');

app.whenReady().then(() => {
  let count = 0;
  console.log("Starting idle time test...");
  const interval = setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime();
    console.log(`[TEST] Raw system idle seconds: ${idleTime}`);
    count++;
    if (count >= 10) {
      clearInterval(interval);
      app.quit();
    }
  }, 1000);
});

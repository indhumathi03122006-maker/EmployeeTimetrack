const { powerMonitor } = require('electron');

function startActivityDetection(thresholdSeconds, onStateChange) {
  let lastActivityAt = new Date();
  let previousIdleTime = 0;

  // Check state every second
  setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime(); // Returns idle time in seconds

    // Detect actual activity: if idle time drops, or remains 0, the user is active
    if (idleTime < previousIdleTime || idleTime === 0) {
      lastActivityAt = new Date();
    }

    let newState = 'active';
    if (idleTime >= thresholdSeconds) {
      newState = 'idle';
    }

    console.log(`[DEBUG] Raw system idle seconds: ${idleTime}, Status: ${newState}, Last Activity: ${lastActivityAt.toLocaleTimeString()}`);

    onStateChange(newState, lastActivityAt);
    
    previousIdleTime = idleTime;
  }, 1000);
}

module.exports = {
  startActivityDetection
};

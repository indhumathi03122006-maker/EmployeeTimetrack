const Notification = require('../models/Notification');

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const cleanupNotifications = async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Only delete read notifications that have a readAt timestamp older than 90 days
    const result = await Notification.deleteMany({
      isRead: true,
      readAt: { $exists: true, $ne: null, $lt: ninetyDaysAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`[Notification Cleanup] Deleted ${result.deletedCount} old read notifications.`);
    }
  } catch (error) {
    console.error('[Notification Cleanup] Error during cleanup:', error);
  }
};

const startNotificationCleanupJob = () => {
  // Run immediately on start, then on interval
  cleanupNotifications();
  setInterval(cleanupNotifications, CLEANUP_INTERVAL_MS);
};

module.exports = startNotificationCleanupJob;

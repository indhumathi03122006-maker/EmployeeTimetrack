const Notification = require('../models/Notification');

/**
 * Creates a notification for a specific user.
 *
 * @param {string|ObjectId} userId - The _id of the user to notify.
 * @param {string} title           - Short notification title.
 * @param {string} message         - Longer notification message.
 * @param {string} type            - One of: 'attendance', 'work-session', 'activity', 'checkout', 'system'
 * @returns {Promise<Document>}    - The saved Notification document.
 */
const createNotification = async (userId, title, message, type) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type
    });
    return notification;
  } catch (error) {
    // Log but do NOT throw — a notification failure must never crash the primary action
    console.error('[Notification] Failed to create notification:', error.message);
    return null;
  }
};

module.exports = createNotification;

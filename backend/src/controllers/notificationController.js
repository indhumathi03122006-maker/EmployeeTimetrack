const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// GET /api/notifications
// Returns the authenticated user's notifications (newest first) with pagination + unread count
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ user: userId, isRead: false }),
      Notification.countDocuments({ user: userId })
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Notification] Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

// GET /api/notifications/unread-count
// Returns only the count of unread notifications for the authenticated user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('[Notification] Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Server error fetching unread count' });
  }
};

// PUT /api/notifications/:id/read
// Marks a single notification as read — only if it belongs to req.user._id
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id }  = req.params;

    // Validate that the provided id is a valid ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    let notification = await Notification.findOne({ _id: id, user: userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or does not belong to you'
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('[Notification] Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
};

// PUT /api/notifications/read-all
// Marks ALL unread notifications belonging to req.user._id as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('[Notification] Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};

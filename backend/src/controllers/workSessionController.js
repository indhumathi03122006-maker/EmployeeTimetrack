const WorkSession = require('../models/WorkSession');
const Attendance = require('../models/Attendance');
const createNotification = require('../utils/createNotification');

// Helper to get consistent today's date
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// POST /api/work-session/start
const startWorkSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayDate = getTodayDate();

    // 1. Check if employee has checked in today
    const attendance = await Attendance.findOne({ user: userId, date: todayDate });
    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'Must check in before starting a work session'
      });
    }

    // 2. Check for an existing active session
    const existingActiveSession = await WorkSession.findOne({
      user: userId,
      status: { $in: ['active', 'idle'] }
    });
    if (existingActiveSession) {
      return res.status(400).json({
        success: false,
        message: 'An active work session already exists'
      });
    }

    const now = new Date();
    const newSession = await WorkSession.create({
      user: userId,
      attendance: attendance._id,
      startTime: now,
      status: 'active',
      lastActivityAt: now,
      activeDuration: 0,
      idleDuration: 0
    });

    // Fire notification (non-blocking — error is handled inside helper)
    createNotification(
      userId,
      'Work Session Started',
      'Your work session has started.',
      'work-session'
    );

    if (req.user.manager) {
      createNotification(
        req.user.manager,
        'Work Session Started',
        `${req.user.name} started work.`,
        'work-session'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Work session started',
      session: newSession
    });
  } catch (error) {
    console.error('[DEBUG] Error starting work session:', error);
    res.status(500).json({ success: false, message: 'Server error starting work session' });
  }
};

// POST /api/work-session/activity
const updateActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.body;

    if (!['active', 'idle'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "idle"'
      });
    }

    const session = await WorkSession.findOne({
      user: userId,
      status: { $in: ['active', 'idle'] }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active work session found'
      });
    }

    if (session.status === status) {
      // Periodic heartbeat received without a status change.
      // Do not reset the timer, do not double-count duration, and do not update lastActivityAt.
      return res.json({
        success: true,
        message: 'Status unchanged',
        session
      });
    }

    const now = new Date();
    
    if (session.lastActivityAt) {
      const elapsedMinutes = (now - session.lastActivityAt) / (1000 * 60);
      
      if (session.status === 'active') {
        session.activeDuration += elapsedMinutes;
      } else if (session.status === 'idle') {
        session.idleDuration += elapsedMinutes;
      }
    }

    session.status = status;
    session.lastActivityAt = now;

    await session.save();

    if (req.user.manager) {
      if (status === 'idle') {
        createNotification(
          req.user.manager,
          'Employee Idle',
          `${req.user.name} is now idle.`,
          'activity'
        );
      } else if (status === 'active') {
        createNotification(
          req.user.manager,
          'Employee Active',
          `${req.user.name} is active again.`,
          'activity'
        );
      }
    }

    res.json({
      success: true,
      message: 'Activity status updated',
      session
    });
  } catch (error) {
    console.error('[DEBUG] Error updating activity:', error);
    res.status(500).json({ success: false, message: 'Server error updating activity status' });
  }
};

// GET /api/work-session/current
const getCurrentWorkSession = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await WorkSession.findOne({
      user: userId,
      status: { $in: ['active', 'idle'] }
    });

    if (session) {
      return res.json({
        success: true,
        session
      });
    } else {
      return res.json({
        success: true,
        session: null
      });
    }
  } catch (error) {
    console.error('[DEBUG] Error fetching current work session:', error);
    res.status(500).json({ success: false, message: 'Server error fetching current session' });
  }
};

// POST /api/work-session/end
const endWorkSession = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await WorkSession.findOne({
      user: userId,
      status: { $in: ['active', 'idle'] }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active work session found to end'
      });
    }

    const now = new Date();

    if (session.lastActivityAt) {
      const elapsedMinutes = (now - session.lastActivityAt) / (1000 * 60);
      
      if (session.status === 'active') {
        session.activeDuration += elapsedMinutes;
      } else if (session.status === 'idle') {
        session.idleDuration += elapsedMinutes;
      }
    }

    session.endTime = now;
    session.status = 'ended';
    session.lastActivityAt = now;

    await session.save();

    // Fire employee notification
    createNotification(
      userId,
      'Work Session Ended',
      'Your work session has ended.',
      'work-session'
    );

    if (req.user.manager) {
      createNotification(
        req.user.manager,
        'Work Session Ended',
        `${req.user.name} ended their work session.`,
        'work-session'
      );
    }

    res.json({
      success: true,
      message: 'Work session ended',
      session
    });
  } catch (error) {
    console.error('[DEBUG] Error ending work session:', error);
    res.status(500).json({ success: false, message: 'Server error ending work session' });
  }
};

module.exports = {
  startWorkSession,
  updateActivity,
  getCurrentWorkSession,
  endWorkSession
};

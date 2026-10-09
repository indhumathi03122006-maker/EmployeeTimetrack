const Attendance = require('../models/Attendance');
const WorkSession = require('../models/WorkSession');
const Settings = require('../models/Settings');
const createNotification = require('../utils/createNotification');

// Helper to get consistent today's date (server time, midnight)
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// POST /api/attendance/check-in
const checkIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayDate = getTodayDate();
    
    // Check if attendance already exists for today
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: todayDate
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    const now = new Date();
    
    // Company Working Hours Logic
    let isWorkingDay = true;
    let isLate = false;
    
    const settings = await Settings.findOne();
    if (settings) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[now.getDay()];
      
      isWorkingDay = (settings.workingDays || []).includes(todayName);
      
      if (isWorkingDay && settings.workStartTime) {
        const [hours, minutes] = settings.workStartTime.split(':').map(Number);
        const expectedStartTime = new Date(todayDate);
        expectedStartTime.setHours(hours, minutes, 0, 0);
        
        if (now > expectedStartTime) {
          isLate = true;
        }
      }
    }

    const newAttendance = await Attendance.create({
      user: userId,
      date: todayDate,
      checkIn: now,
      status: 'present',
      workDuration: 0,
      isWorkingDay,
      isLate
    });

    // Fire notification (non-blocking — error is handled inside helper)
    createNotification(
      userId,
      'Attendance Started',
      'Your attendance has been marked successfully.',
      'attendance'
    );

    if (req.user.manager) {
      createNotification(
        req.user.manager,
        'Employee Checked In',
        `${req.user.name} checked in.`,
        'attendance'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      attendance: newAttendance
    });
  } catch (error) {
    console.error('[DEBUG] Error during check-in:', error);
    res.status(500).json({ success: false, message: 'Server error during check-in' });
  }
};

// POST /api/attendance/check-out
const checkOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayDate = getTodayDate();

    const attendance = await Attendance.findOne({
      user: userId,
      date: todayDate
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    const now = new Date();
    attendance.checkOut = now;
    
    // Calculate work duration in minutes
    const durationMs = now - attendance.checkIn;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    attendance.workDuration = durationMinutes;

    // Company Working Hours Logic
    const settings = await Settings.findOne();
    if (settings && settings.workEndTime) {
      const [hours, minutes] = settings.workEndTime.split(':').map(Number);
      const expectedEndTime = new Date(todayDate);
      expectedEndTime.setHours(hours, minutes, 0, 0);
      
      if (now < expectedEndTime) {
        attendance.isEarlyCheckout = true;
      }
    }

    await attendance.save();

    // Fire notification (non-blocking — error is handled inside helper)
    createNotification(
      userId,
      'Checked Out',
      'Your attendance has been checked out successfully.',
      'checkout'
    );

    if (req.user.manager) {
      createNotification(
        req.user.manager,
        'Employee Checked Out',
        `${req.user.name} checked out.`,
        'checkout'
      );
    }

    res.json({
      success: true,
      message: 'Checked out successfully',
      attendance
    });
  } catch (error) {
    console.error('[DEBUG] Error during check-out:', error);
    res.status(500).json({ success: false, message: 'Server error during check-out' });
  }
};

// GET /api/attendance/today
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayDate = getTodayDate();

    const attendance = await Attendance.findOne({
      user: userId,
      date: todayDate
    });

    if (attendance) {
      return res.json({
        success: true,
        attendance
      });
    } else {
      return res.json({
        success: true,
        attendance: null,
        message: 'No attendance record for today'
      });
    }
  } catch (error) {
    console.error('[DEBUG] Error fetching today attendance:', error);
    res.status(500).json({ success: false, message: 'Server error fetching attendance' });
  }
};

// GET /api/attendance/history
const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Attendance.countDocuments({ user: userId });
    
    const attendanceRecords = await Attendance.find({ user: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      attendance: attendanceRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error fetching attendance history:', error);
    res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
};

// GET /api/attendance/report
const getReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 }).lean();

    const attendanceIds = attendanceRecords.map(a => a._id);

    const workSessions = await WorkSession.find({
      attendance: { $in: attendanceIds }
    }).lean();

    const now = new Date();
    const workSessionMap = {};
    workSessions.forEach(ws => {
      const attId = ws.attendance.toString();
      if (!workSessionMap[attId]) {
        workSessionMap[attId] = { activeDuration: 0, idleDuration: 0 };
      }

      let additionalActive = 0;
      let additionalIdle = 0;
      if ((ws.status === 'active' || ws.status === 'idle') && ws.lastActivityAt) {
        const elapsedMinutes = (now - ws.lastActivityAt) / (1000 * 60);
        if (ws.status === 'active') additionalActive = elapsedMinutes;
        else if (ws.status === 'idle') additionalIdle = elapsedMinutes;
      }

      workSessionMap[attId].activeDuration += (ws.activeDuration || 0) + additionalActive;
      workSessionMap[attId].idleDuration += (ws.idleDuration || 0) + additionalIdle;
    });

    let totalWorkingDays = attendanceRecords.length;
    let presentDays = attendanceRecords.filter(a => a.status === 'present').length;
    let totalWorkTime = 0;
    let totalActiveTime = 0;
    let totalIdleTime = 0;

    const reportData = attendanceRecords.map(record => {
      const session = workSessionMap[record._id.toString()] || null;
      const activeDuration = session ? session.activeDuration : 0;
      const idleDuration = session ? session.idleDuration : 0;
      
      totalWorkTime += record.workDuration || 0;
      totalActiveTime += activeDuration;
      totalIdleTime += idleDuration;

      return {
        _id: record._id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        workDuration: record.workDuration,
        activeDuration: activeDuration,
        idleDuration: idleDuration
      };
    });

    res.json({
      success: true,
      summary: {
        totalWorkingDays,
        presentDays,
        totalWorkTime,
        totalActiveTime,
        totalIdleTime
      },
      records: reportData
    });

  } catch (error) {
    console.error('[DEBUG] Error fetching report:', error);
    res.status(500).json({ success: false, message: 'Server error fetching report' });
  }
};

// POST /api/attendance/break/start
const startBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayDate = getTodayDate();

    const attendance = await Attendance.findOne({
      user: userId,
      date: todayDate
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No attendance record for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out' });
    }

    const workSession = await WorkSession.findOne({
      attendance: attendance._id,
      status: { $in: ['active', 'idle'] }
    });

    if (!workSession) {
      return res.status(400).json({ success: false, message: 'No active work session' });
    }

    if (attendance.isOnBreak) {
      return res.status(400).json({ success: false, message: 'Already on break' });
    }

    attendance.isOnBreak = true;
    attendance.breakStart = new Date();
    attendance.breakEnd = null;

    await attendance.save();

    res.json({
      success: true,
      message: 'Break started successfully',
      attendance
    });
  } catch (error) {
    console.error('[DEBUG] Error during startBreak:', error);
    res.status(500).json({ success: false, message: 'Server error during start break' });
  }
};

// POST /api/attendance/break/end
const endBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayDate = getTodayDate();

    const attendance = await Attendance.findOne({
      user: userId,
      date: todayDate
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No attendance record for today' });
    }

    if (!attendance.isOnBreak) {
      return res.status(400).json({ success: false, message: 'Not currently on break' });
    }

    const now = new Date();
    attendance.breakEnd = now;

    if (attendance.breakStart) {
      const durationMs = now - attendance.breakStart;
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      attendance.breakDuration = (attendance.breakDuration || 0) + durationMinutes;
    }

    attendance.isOnBreak = false;

    await attendance.save();

    res.json({
      success: true,
      message: 'Break ended successfully',
      attendance
    });
  } catch (error) {
    console.error('[DEBUG] Error during endBreak:', error);
    res.status(500).json({ success: false, message: 'Server error during end break' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getReport,
  startBreak,
  endBreak
};

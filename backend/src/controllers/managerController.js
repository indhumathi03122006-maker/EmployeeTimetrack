const User = require('../models/User');
const Attendance = require('../models/Attendance');
const WorkSession = require('../models/WorkSession');

// Helper to get consistent today's date (server time, midnight)
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// @desc    Get manager dashboard summary
// @route   GET /api/manager/dashboard
// @access  Private/Manager
const getDashboardSummary = async (req, res) => {
  try {
    const managerId = req.user._id;

    // 1. Get total team members
    const teamMembers = await User.find({ manager: managerId });
    const teamMemberIds = teamMembers.map((member) => member._id);
    const totalTeamMembers = teamMembers.length;

    // 2. Get today's attendance
    const today = getTodayDate();
    const todayAttendance = await Attendance.find({
      user: { $in: teamMemberIds },
      date: today,
    });

    const presentCount = todayAttendance.length;
    const absentCount = totalTeamMembers - presentCount;

    // 3. Get current activity
    const activeSessions = await WorkSession.find({
      user: { $in: teamMemberIds },
      status: 'active',
    });

    const idleSessions = await WorkSession.find({
      user: { $in: teamMemberIds },
      status: 'idle',
    });

    const currentlyWorking = activeSessions.length;
    const currentlyIdle = idleSessions.length;

    res.status(200).json({
      success: true,
      data: {
        totalTeamMembers,
        present: presentCount,
        absent: absentCount,
        currentlyWorking,
        currentlyIdle,
      },
    });
  } catch (error) {
    console.error('Error in getDashboardSummary:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get team members
// @route   GET /api/manager/employees
// @access  Private/Manager
const getTeamMembers = async (req, res) => {
  try {
    const managerId = req.user._id;
    const teamMembers = await User.find({ manager: managerId }).select('-password');

    res.status(200).json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    console.error('Error in getTeamMembers:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get team attendance
// @route   GET /api/manager/attendance
// @access  Private/Manager
const getTeamAttendance = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { startDate, endDate } = req.query;

    const teamMembers = await User.find({ manager: managerId });
    const teamMemberIds = teamMembers.map((member) => member._id);

    let query = { user: { $in: teamMemberIds } };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('user', 'name email department')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendanceRecords,
    });
  } catch (error) {
    console.error('Error in getTeamAttendance:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get team work sessions
// @route   GET /api/manager/work-time
// @access  Private/Manager
const getTeamWorkSessions = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { startDate, endDate } = req.query;

    const teamMembers = await User.find({ manager: managerId });
    const teamMemberIds = teamMembers.map((member) => member._id);

    let query = { user: { $in: teamMemberIds } };

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.startTime = { $gte: new Date(startDate) };
    }

    const workSessions = await WorkSession.find(query)
      .populate('user', 'name email department')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      data: workSessions,
    });
  } catch (error) {
    console.error('Error in getTeamWorkSessions:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get team current activity
// @route   GET /api/manager/current-activity
// @access  Private/Manager
const getTeamCurrentActivity = async (req, res) => {
  try {
    const managerId = req.user._id;

    const teamMembers = await User.find({ manager: managerId }).select('name email department');
    const teamMemberIds = teamMembers.map((member) => member._id);

    // Find the most recent active or idle session for each team member
    const currentSessions = await WorkSession.find({
      user: { $in: teamMemberIds },
      status: { $in: ['active', 'idle'] }
    }).populate('user', 'name email department');

    res.status(200).json({
      success: true,
      data: currentSessions,
    });
  } catch (error) {
    console.error('Error in getTeamCurrentActivity:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get team reports
// @route   GET /api/manager/reports
// @access  Private/Manager
const getTeamReports = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { startDate, endDate, employeeId } = req.query;

    const teamMembers = await User.find({ manager: managerId });
    const teamMemberIds = teamMembers.map((member) => member._id);

    let targetUserIds = teamMemberIds;
    
    // If specific employee requested, ensure they are in the manager's team
    if (employeeId) {
      if (!teamMemberIds.some(id => id.toString() === employeeId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this employee' });
      }
      targetUserIds = [employeeId];
    }

    let query = { user: { $in: targetUserIds } };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    const attendanceRecords = await Attendance.find(query).populate('user', 'name email department').sort({ date: -1 });
    
    // Get corresponding work sessions
    const workSessionQuery = { user: { $in: targetUserIds } };
    if (startDate && endDate) {
       workSessionQuery.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
       workSessionQuery.startTime = { $gte: new Date(startDate) };
    }
    const workSessions = await WorkSession.find(workSessionQuery);

    // Build report data combining attendance and work sessions
    const reportData = attendanceRecords.map(record => {
        // Find all work sessions for this user on this specific day
        const dailySessions = workSessions.filter(ws => 
            ws.user.toString() === record.user._id.toString() &&
            ws.attendance.toString() === record._id.toString()
        );

        const now = new Date();
        let totalActive = 0;
        let totalIdle = 0;

        dailySessions.forEach(session => {
            let additionalActive = 0;
            let additionalIdle = 0;
            if ((session.status === 'active' || session.status === 'idle') && session.lastActivityAt) {
                const elapsedMinutes = (now - session.lastActivityAt) / (1000 * 60);
                if (session.status === 'active') additionalActive = elapsedMinutes;
                else if (session.status === 'idle') additionalIdle = elapsedMinutes;
            }

            totalActive += (session.activeDuration || 0) + additionalActive;
            totalIdle += (session.idleDuration || 0) + additionalIdle;
        });

        return {
            _id: record._id,
            user: record.user,
            date: record.date,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            status: record.status,
            workDuration: record.workDuration,
            activeTime: totalActive,
            idleTime: totalIdle
        };
    });

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error in getTeamReports:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


module.exports = {
  getDashboardSummary,
  getTeamMembers,
  getTeamAttendance,
  getTeamWorkSessions,
  getTeamCurrentActivity,
  getTeamReports
};

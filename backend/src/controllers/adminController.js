const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const WorkSession = require('../models/WorkSession');
const createNotification = require('../utils/createNotification');
const fillAbsentRecords = require('../utils/fillAbsent');

// Helper to get today's date boundaries
const getTodayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get dashboard summary for admin (organization-wide)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardSummary = async (req, res) => {
  try {
    const { start, end } = getTodayBounds();

    // 1. Get total counts
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalManagers = await User.countDocuments({ role: 'manager' });

    // 2. Get attendance for all employees today
    const employeeIds = (await User.find({ role: 'employee' }, '_id')).map(u => u._id);
    
    const presentRecords = await Attendance.find({
      user: { $in: employeeIds },
      date: { $gte: start, $lte: end }
    });
    const present = presentRecords.length;
    const absent = totalEmployees - present;

    // 3. Get active and idle counts from WorkSessions for employees
    const activeSessions = await WorkSession.countDocuments({
      user: { $in: employeeIds },
      status: 'active'
    });
    
    const idleSessions = await WorkSession.countDocuments({
      user: { $in: employeeIds },
      status: 'idle'
    });

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalManagers,
        present,
        absent,
        currentlyWorking: activeSessions,
        currentlyIdle: idleSessions
      }
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all employees and managers
// @route   GET /api/admin/employees
// @access  Private/Admin
const getAllEmployees = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['employee', 'manager'] } })
      .select('-password')
      .populate('manager', 'name email')
      .sort({ role: -1, name: 1 });
      
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Admin Employees Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get organization-wide attendance records
// @route   GET /api/admin/attendance
// @access  Private/Admin
const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'name email department')
      .sort({ date: -1 });

    const allEmployees = await User.find({ role: 'employee' });
    const filledRecords = fillAbsentRecords(allEmployees, attendance, 'attendance', startDate, endDate);

    res.json({ success: true, data: filledRecords });
  } catch (error) {
    console.error('Admin Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get organization-wide work sessions
// @route   GET /api/admin/work-time
// @access  Private/Admin
const getAllWorkSessions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.startTime = { $gte: start, $lte: end };
    }

    const sessions = await WorkSession.find(query)
      .populate('user', 'name email department')
      .sort({ startTime: -1 });

    const allEmployees = await User.find({ role: 'employee' });
    const filledSessions = fillAbsentRecords(allEmployees, sessions, 'workSession', startDate, endDate);

    res.json({ success: true, data: filledSessions });
  } catch (error) {
    console.error('Admin Work Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get organization-wide current activity
// @route   GET /api/admin/current-activity
// @access  Private/Admin
const getAllCurrentActivity = async (req, res) => {
  try {
    const sessions = await WorkSession.find({
      status: { $in: ['active', 'idle'] }
    })
      .populate('user', 'name email department')
      .sort({ lastActivityAt: -1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Admin Current Activity Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get organization-wide reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAllReports = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let query = { date: { $gte: start, $lte: end } };
    
    if (employeeId) {
      // Verify employee exists and is an employee
      const employee = await User.findOne({ _id: employeeId, role: 'employee' });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      query.user = employeeId;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('user', 'name email')
      .sort({ date: -1 });

    // Build report with aggregated work session data
    const reports = await Promise.all(attendanceRecords.map(async (record) => {
      const recDateStart = new Date(record.date);
      recDateStart.setHours(0, 0, 0, 0);
      const recDateEnd = new Date(record.date);
      recDateEnd.setHours(23, 59, 59, 999);

      const sessions = await WorkSession.find({
        user: record.user._id,
        startTime: { $gte: recDateStart, $lte: recDateEnd }
      });

      const now = new Date();
      let totalActive = 0;
      let totalIdle = 0;

      sessions.forEach(session => {
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
    }));

    let targetEmployees;
    if (employeeId) {
      targetEmployees = await User.find({ _id: employeeId, role: 'employee' });
    } else {
      targetEmployees = await User.find({ role: 'employee' });
    }
    const filledReports = fillAbsentRecords(targetEmployees, reports, 'report', startDate, endDate);

    res.json({ success: true, data: filledReports });
  } catch (error) {
    console.error('Admin Reports Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add Employee
// @route   POST /api/admin/employees
// @access  Private/Admin
const addEmployee = async (req, res, next) => {
  try {
    const { name, email, department, password, manager } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let managerId = null;
    if (manager) {
      const managerUser = await User.findOne({ _id: manager, role: 'manager' });
      if (!managerUser) {
        return res.status(400).json({ success: false, message: 'Invalid manager selected' });
      }
      managerId = manager;
    }

    const user = await User.create({
      name,
      email,
      department,
      password,
      role: 'employee',
      manager: managerId
    });

    const activeAdmins = await User.find({ role: 'admin', isActive: true });
    activeAdmins.forEach(admin => {
      createNotification(
        admin._id,
        'New Employee Added',
        `${user.name} was added to the organization.`,
        'user-management'
      );
    });

    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role }});
  } catch (error) {
    next(error);
  }
};

// @desc    Add Manager
// @route   POST /api/admin/managers
// @access  Private/Admin
const addManager = async (req, res, next) => {
  try {
    const { name, email, department, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      department,
      password,
      role: 'manager'
    });

    const activeAdmins = await User.find({ role: 'admin', isActive: true });
    activeAdmins.forEach(admin => {
      createNotification(
        admin._id,
        'New Manager Added',
        `${user.name} was added to the organization.`,
        'user-management'
      );
    });

    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role }});
  } catch (error) {
    next(error);
  }
};

// @desc    Edit Basic User Details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, department, manager } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.name = name || user.name;
    user.department = department !== undefined ? department : user.department;
    
    // Only employees can have managers
    if (user.role === 'employee' && manager !== undefined) {
      if (manager) {
        const managerUser = await User.findOne({ _id: manager, role: 'manager' });
        if (!managerUser) {
          return res.status(400).json({ success: false, message: 'Invalid manager selected' });
        }
        user.manager = manager;
      } else {
        user.manager = null; // Unassign manager
      }
    }

    await user.save();
    res.json({ success: true, data: { _id: user._id, name: user.name, role: user.role, manager: user.manager }});
  } catch (error) {
    next(error);
  }
};

// @desc    Activate / Deactivate User
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();
    
    const activeAdmins = await User.find({ role: 'admin', isActive: true });
    const title = isActive ? 'User Activated' : 'User Deactivated';
    const message = isActive ? `${user.name} was activated.` : `${user.name} was deactivated.`;
    activeAdmins.forEach(admin => {
      createNotification(admin._id, title, message, 'user-management');
    });

    res.json({ success: true, data: { _id: user._id, isActive: user.isActive }});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getAllEmployees,
  getAllAttendance,
  getAllWorkSessions,
  getAllCurrentActivity,
  getAllReports,
  addEmployee,
  addManager,
  updateUser,
  updateUserStatus
};

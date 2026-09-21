const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');

// Apply protection and admin authorization to all routes in this file
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardSummary);
router.get('/employees', getAllEmployees); // This gets both employees and managers
router.get('/attendance', getAllAttendance);
router.get('/work-time', getAllWorkSessions);
router.get('/current-activity', getAllCurrentActivity);
router.get('/reports', getAllReports);

// User Management Routes
router.post('/employees', addEmployee);
router.post('/managers', addManager);
router.put('/users/:id', updateUser);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;

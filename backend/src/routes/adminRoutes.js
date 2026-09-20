const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardSummary,
  getAllEmployees,
  getAllAttendance,
  getAllWorkSessions,
  getAllCurrentActivity,
  getAllReports
} = require('../controllers/adminController');

// Apply protection and admin authorization to all routes in this file
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardSummary);
router.get('/employees', getAllEmployees);
router.get('/attendance', getAllAttendance);
router.get('/work-time', getAllWorkSessions);
router.get('/current-activity', getAllCurrentActivity);
router.get('/reports', getAllReports);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardSummary,
  getTeamMembers,
  getTeamAttendance,
  getTeamWorkSessions,
  getTeamCurrentActivity,
  getTeamReports
} = require('../controllers/managerController');

// Apply protection and manager authorization to all routes in this file
router.use(protect);
router.use(authorize('manager'));

router.get('/dashboard', getDashboardSummary);
router.get('/employees', getTeamMembers);
router.get('/attendance', getTeamAttendance);
router.get('/work-time', getTeamWorkSessions);
router.get('/current-activity', getTeamCurrentActivity);
router.get('/reports', getTeamReports);

module.exports = router;

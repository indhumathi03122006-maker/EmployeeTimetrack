const express = require('express');
const router = express.Router();
const { 
  checkIn, 
  checkOut, 
  getTodayAttendance, 
  getAttendanceHistory,
  getReport
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/history', protect, getAttendanceHistory);
router.get('/report', protect, getReport);

module.exports = router;

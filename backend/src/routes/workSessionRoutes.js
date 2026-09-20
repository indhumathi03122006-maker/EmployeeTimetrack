const express = require('express');
const router = express.Router();
const { 
  startWorkSession, 
  updateActivity, 
  getCurrentWorkSession, 
  endWorkSession 
} = require('../controllers/workSessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startWorkSession);
router.post('/activity', protect, updateActivity);
router.get('/current', protect, getCurrentWorkSession);
router.post('/end', protect, endWorkSession);

module.exports = router;

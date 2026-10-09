const express = require('express');
const router = express.Router();
const { getAppActivities, logAppActivity } = require('../controllers/appActivityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAppActivities);
router.post('/', protect, logAppActivity);

module.exports = router;

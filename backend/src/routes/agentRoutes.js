const express = require('express');
const { requestPairingCode, pairAgent, getStatus, heartbeat } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/pairing-code', protect, requestPairingCode);
router.post('/pair', pairAgent);
router.get('/status', protect, getStatus);
router.post('/heartbeat', protect, heartbeat);

module.exports = router;

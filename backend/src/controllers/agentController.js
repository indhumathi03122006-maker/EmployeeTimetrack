const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const AgentDevice = require('../models/AgentDevice');
const PairingCode = require('../models/PairingCode');

// POST /api/agent/pairing-code
const requestPairingCode = async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate random 8 character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Expire in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save
    await PairingCode.create({
      user: userId,
      code,
      expiresAt
    });
    
    console.log('[Backend] Pairing flow started');

    res.json({
      success: true,
      code,
      expiresAt
    });
  } catch (error) {
    console.error('[DEBUG] Error generating pairing code:', error);
    res.status(500).json({ success: false, message: 'Server error generating code' });
  }
};

// POST /api/agent/pair
const pairAgent = async (req, res) => {
  try {
    console.log('[Backend] Pairing request received');
    const { code } = req.body;

    if (!code) {
      console.log('[Backend] Pairing failed: Code missing');
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const pairing = await PairingCode.findOne({ code });

    if (!pairing) {
      console.log('[Backend] Pairing failed: Invalid/expired code');
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    if (new Date() > pairing.expiresAt) {
      await PairingCode.deleteOne({ _id: pairing._id });
      return res.status(400).json({ success: false, message: 'Code has expired' });
    }

    const userId = pairing.user;

    // Invalidate the code
    await PairingCode.deleteOne({ _id: pairing._id });

    // Revoke any previous agent devices for this user for simplicity/security (optional but good practice)
    await AgentDevice.updateMany({ user: userId }, { isActive: false });

    // Generate long-lived agent token
    const agentToken = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const tokenHash = await bcrypt.hash(agentToken, salt);

    // Create device
    await AgentDevice.create({
      user: userId,
      tokenHash,
      isActive: true,
      lastSeenAt: new Date()
    });

    console.log('[Backend] Pairing successful');

    res.json({
      success: true,
      agentToken
    });
  } catch (error) {
    console.error('[DEBUG] Error pairing agent:', error);
    res.status(500).json({ success: false, message: 'Server error pairing agent' });
  }
};

// GET /api/agent/status
const getStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if there's an active device that was seen in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const device = await AgentDevice.findOne({
      user: userId,
      isActive: true,
      lastSeenAt: { $gt: twoMinutesAgo }
    });

    if (device) {
      return res.json({ success: true, connected: true });
    }

    res.json({ success: true, connected: false });
  } catch (error) {
    console.error('[DEBUG] Error checking agent status:', error);
    res.status(500).json({ success: false, message: 'Server error checking status' });
  }
};

// POST /api/agent/heartbeat
const heartbeat = async (req, res) => {
  try {
    // Note: protect middleware sets req.user and req.agentDevice (if authenticated via agent token)
    if (!req.agentDevice) {
      return res.status(401).json({ success: false, message: 'Agent token required for heartbeat' });
    }

    req.agentDevice.lastSeenAt = new Date();
    await req.agentDevice.save();

    res.json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    console.error('[DEBUG] Error in agent heartbeat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  requestPairingCode,
  pairAgent,
  getStatus,
  heartbeat
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
         return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      return next();
    } catch (error) {
      // If JWT verification fails, check if it's an Agent Token
      try {
        const AgentDevice = require('../models/AgentDevice');
        const allAgents = await AgentDevice.find({ isActive: true }).populate('user');
        
        let validAgent = null;
        for (const agent of allAgents) {
          if (await agent.verifyToken(token)) {
            validAgent = agent;
            break;
          }
        }

        if (validAgent && validAgent.user) {
          req.user = validAgent.user;
          req.agentDevice = validAgent;
          return next();
        }
      } catch (agentError) {
         console.error('[DEBUG] Agent verification failed:', agentError);
      }

      console.error('[DEBUG] JWT and Agent verification failed');
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

module.exports = { protect, authorize };

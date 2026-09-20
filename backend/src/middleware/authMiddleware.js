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
      
      next();
    } catch (error) {
      console.error('[DEBUG] JWT verification failed');
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
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

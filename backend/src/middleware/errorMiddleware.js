const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  // Log the stack trace only if it's not a known, safe API error
  if (!err.statusCode || err.statusCode >= 500) {
     console.error(err.stack);
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Resource not found or invalid ID format'
    });
  }

  const statusCode = err.statusCode ? err.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Server error. Please try again.' : err.message
  });
};

module.exports = errorHandler;

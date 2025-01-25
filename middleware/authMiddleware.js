const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check for the presence of the Authorization header
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized: Token is missing.' });
  }

  // Extract the token from the "Bearer" scheme
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token is malformed.' });
  }

  try {
    // Verify the token and extract user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user data to the request object
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token has expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }

    // General error fallback
    res.status(403).json({ message: 'Forbidden: Token verification failed.' });
  }
};

// Middleware to log authentication attempts
exports.authLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Authentication attempt: ${req.method} ${req.url}`);
  next();
};

// Middleware to check user role (e.g., admin)
exports.checkRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }
  };
};

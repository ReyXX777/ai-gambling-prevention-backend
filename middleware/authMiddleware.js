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

// Added Middleware: Rate Limiting for Authentication Attempts (example: 5 attempts per minute)
const authRateLimiter = async (req, res, next) => {
    // In a real application, you would use a database or caching mechanism to track authentication attempts.
    // This is a simplified example using in-memory storage (not suitable for production).
    const authAttempts = []; // Replace with database logic
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    const recentAttempts = authAttempts.filter(attempt => attempt.timestamp > oneMinuteAgo && attempt.ip === req.ip); //Added IP address check

    if (recentAttempts.length >= 5) {
        return res.status(429).json({ message: 'Too many authentication attempts. Please try again later.' }); // 429 Too Many Requests
    }

    authAttempts.push({ ip: req.ip, timestamp: now }); // Replace with database insert

    next();
};

// Added Middleware: Brute-Force Protection (example: block IP after 3 failed attempts in 5 minutes)
const bruteForceProtector = async (req, res, next) => {
  const failedAttempts = []; // Replace with database logic
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  const recentFailures = failedAttempts.filter(attempt => attempt.timestamp > fiveMinutesAgo && attempt.ip === req.ip && !attempt.success);

  if (recentFailures.length >= 3) {
      return res.status(429).json({ message: 'Too many failed attempts. Your IP has been temporarily blocked.' });
  }

  res.on('finish', () => { //Check if request was successful and update attempts
    const success = res.statusCode < 400;
    failedAttempts.push({ip: req.ip, timestamp: now, success});
  });

  next();
};


module.exports = {
    authenticateToken,
    authLogger,
    checkRole,
    authRateLimiter,
    bruteForceProtector,
};

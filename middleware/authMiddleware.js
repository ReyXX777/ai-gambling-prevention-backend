const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check for the presence of the Authorization header
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized: Token is missing' });
  }

  // Extract the token from the "Bearer" scheme
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token is malformed' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }

    // Attach user data to the request object
    req.user = user;
    next();
  });
};

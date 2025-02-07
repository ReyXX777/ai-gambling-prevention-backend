const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Set up PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware to validate comment data
const validateComment = (req, res, next) => {
    const { user_id, content } = req.body;
    if (!user_id || !content) {
        return res.status(400).json({ error: 'User ID and content are required' });
    }
    next();
};

// Middleware to log comment actions
const commentLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Comment action: ${req.method} ${req.url}`);
    next();
};

// Middleware to check if user exists
const checkUserExists = async (req, res, next) => {
    const { user_id } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        next();
    } catch (error) {
        console.error('Error checking user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Added Middleware: Input Sanitization
const sanitizeInput = (req, res, next) => {
    if (req.body.content) {
      req.body.content = req.body.content.trim(); //Remove leading/trailing spaces
      req.body.content = req.body.content.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    next();
  };

// Added Middleware: Comment throttling (example: 5 comments per minute per user)
const commentThrottler = async (req, res, next) => {
    const { user_id } = req.body;
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    try {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM comments WHERE user_id = $1 AND created_at > $2',
        [user_id, oneMinuteAgo]
      );
  
      const commentCount = parseInt(countResult.rows[0].count);
  
      if (commentCount >= 5) {
        return res.status(429).json({ error: 'Too many comments. Please try again later.' }); // 429 Too Many Requests
      }
  
      next();
    } catch (error) {
      console.error('Error checking comment rate:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };


// Create a new comment
router.post('/', sanitizeInput, commentThrottler, validateComment, checkUserExists, async (req, res) => {
    const { user_id, content } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO comments (user_id, content) VALUES ($1, $2) RETURNING *',
            [user_id, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ... (rest of the routes remain the same)

module.exports = router;

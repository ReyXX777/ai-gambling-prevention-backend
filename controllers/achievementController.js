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
    const { comment_text, achievement_id } = req.body;
    if (!comment_text || !achievement_id) {
        return res.status(400).json({ error: 'Comment text and achievement ID are required' });
    }
    next();
};

// Middleware to log incoming requests
const requestLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
};

// Middleware to check if achievement exists
const checkAchievementExists = async (req, res, next) => {
    const { achievement_id } = req.body;
    try {
        const result = await pool.query('SELECT * FROM achievements WHERE id = $1', [achievement_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Achievement not found' });
        }
        next();
    } catch (error) {
        console.error('Error checking achievement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Added middleware: Input Sanitization
const sanitizeInput = (req, res, next) => {
    if (req.body.comment_text) {
      req.body.comment_text = req.body.comment_text.trim(); //Remove leading/trailing spaces
      req.body.comment_text = req.body.comment_text.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    next();
  };

// Added middleware: Error Logging with Stack Trace (for development)
const errorLogger = (err, req, res, next) => {
    console.error("ERROR:", err.message);
    console.error("Stack Trace:", err.stack); // Only log stack trace in development
    res.status(500).json({ error: 'Internal Server Error' }); // Don't expose stack trace to users in production
    next();
  };


// Create a new comment
router.post('/', sanitizeInput, validateComment, checkAchievementExists, async (req, res) => {
    const { comment_text, achievement_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO comments (comment_text, achievement_id) VALUES ($1, $2) RETURNING *',
            [comment_text, achievement_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ... (rest of the routes)

//Error handling middleware should be the last one
router.use(errorLogger);

module.exports = router;

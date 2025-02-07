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

// Middleware to validate notification data
const validateNotification = (req, res, next) => {
    const { user_id, message, read_status } = req.body;
    if (!user_id || !message) {
        return res.status(400).json({ error: 'User ID and message are required' });
    }

    const validStatuses = ['unread', 'read'];
    if (read_status && !validStatuses.includes(read_status)) { //Make read_status optional
        return res.status(400).json({ error: `Read status must be one of: ${validStatuses.join(', ')}` });
    }

    next();
};

// Middleware to log notification actions
const notificationLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Notification action: ${req.method} ${req.url}`);
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
    if (req.body.message) {
        req.body.message = req.body.message.trim();
        req.body.message = req.body.message.replace(/<[^>]*>?/gm, ''); //Remove HTML tags
    }
    next();
};

// Added Middleware: Notification Rate Limiting (example: 10 notifications per minute per user)
const rateLimiter = async (req, res, next) => {
    const { user_id } = req.body;
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    try {
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND created_at > $2',
            [user_id, oneMinuteAgo]
        );

        const notificationCount = parseInt(countResult.rows[0].count);

        if (notificationCount >= 10) {
            return res.status(429).json({ error: 'Too many notifications. Please try again later.' }); // 429 Too Many Requests
        }

        next();
    } catch (error) {
        console.error('Error checking notification rate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Create a new notification
router.post('/', sanitizeInput, rateLimiter, validateNotification, checkUserExists, async (req, res) => {
    const { user_id, message, read_status = 'unread' } = req.body; // Default read_status to 'unread'
    try {
        const result = await pool.query(
            'INSERT INTO notifications (user_id, message, read_status) VALUES ($1, $2, $3) RETURNING *',
            [user_id, message, read_status]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ... (rest of the routes)

module.exports = router;

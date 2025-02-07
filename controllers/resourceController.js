const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Set up PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'yourusername',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'yourdatabase',
    password: process.env.DB_PASSWORD || 'yourpassword',
    port: process.env.DB_PORT || 5432,
});

// Middleware to log profile actions
const profileLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Profile action: ${req.method} ${req.url}`);
    next();
};

// Middleware to validate phone number format
const validatePhoneNumber = (req, res, next) => {
    const { phone } = req.body;
    const phoneRegex = /^\d{10}$/; // Assumes a 10-digit phone number format
    if (phone && !phoneRegex.test(phone)) { //Phone number is optional
        return res.status(400).json({ error: 'Invalid phone number format. Must be 10 digits.' });
    }
    next();
};

// Added Middleware: Input Sanitization
const sanitizeInput = (req, res, next) => {
    if (req.body.first_name) {
        req.body.first_name = req.body.first_name.trim();
        req.body.first_name = req.body.first_name.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    if (req.body.last_name) {
        req.body.last_name = req.body.last_name.trim();
        req.body.last_name = req.body.last_name.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    if (req.body.email) {
        req.body.email = req.body.email.trim();
    }
    next();
};

// Added Middleware: Profile Rate Limiting (example: 5 profile updates per hour per user)
const profileRateLimiter = async (req, res, next) => {
    const { user_id } = req.body; // Assuming you have user_id in the request body
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    try {
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM user_profiles WHERE user_id = $1 AND updated_at > $2', // Assuming you have user_id and updated_at in user_profiles table
            [user_id, oneHourAgo]
        );

        const profileUpdateCount = parseInt(countResult.rows[0].count);

        if (profileUpdateCount >= 5) {
            return res.status(429).json({ error: 'Too many profile updates. Please try again later.' }); // 429 Too Many Requests
        }

        next();
    } catch (error) {
        console.error('Error checking profile update rate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



// Create a new user profile
router.post('/profiles', sanitizeInput, validatePhoneNumber, async (req, res) => {
    const { user_id, first_name, last_name, email, phone } = req.body;

    // Input validation
    if (!user_id || !first_name || !last_name || !email) { //Phone is optional
        return res.status(400).json({ error: 'User ID, First Name, Last Name and Email are required.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO user_profiles (user_id, first_name, last_name, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, first_name, last_name, email, phone]
        );
        res.status(201).json({ message: 'Profile created successfully', profile: result.rows[0] });
    } catch (error) {
        console.error('Error creating profile:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ... (rest of the routes remain the same)

// Update a user profile by user ID
router.put('/profiles/:user_id', sanitizeInput, profileRateLimiter, validatePhoneNumber, async (req, res) => {
    const { user_id } = req.params;
    const { first_name, last_name, email, phone } = req.body;

    // Input validation
    if (!first_name || !last_name || !email) { //Phone is optional
        return res.status(400).json({ error: 'First Name, Last Name and Email are required.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    try {
        const result = await pool.query(
            'UPDATE user_profiles SET first_name = $1, last_name = $2, email = $3, phone = $4 WHERE user_id = $5 RETURNING *',
            [first_name, last_name, email, phone, user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found.' });
        }
        res.status(200).json({ message: 'Profile updated successfully', profile: result.rows[0] });
    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


module.exports = router;

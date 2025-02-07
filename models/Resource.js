const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Set up the PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'yourusername', // Use environment variables for sensitive data
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'yourdatabase',
    password: process.env.DB_PASSWORD || 'yourpassword',
    port: process.env.DB_PORT || 5432,
});

// Input validation middleware
const validateResourceInput = (req, res, next) => {
    const { name, type, description } = req.body;
    if (!name || !type || !description) {
        return res.status(400).json({ error: 'Name, type, and description are required.' });
    }
    next();
};

// Middleware to log resource actions
const resourceLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Resource action: ${req.method} ${req.url}`);
    next();
};

// Middleware to check if resource exists
const checkResourceExists = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM resources WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        next();
    } catch (error) {
        console.error('Error checking resource:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Added Middleware: Input Sanitization
const sanitizeInput = (req, res, next) => {
    if (req.body.name) {
        req.body.name = req.body.name.trim();
        req.body.name = req.body.name.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    if (req.body.description) {
        req.body.description = req.body.description.trim();
        req.body.description = req.body.description.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    if (req.body.type) {
        req.body.type = req.body.type.trim();
        req.body.type = req.body.type.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    next();
};

// Added Middleware: Resource Rate Limiting (example: 5 creations per hour per user)
const resourceRateLimiter = async (req, res, next) => {
    const { user_id } = req.body; // Assuming you have user_id in the request body
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    try {
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM resources WHERE user_id = $1 AND created_at > $2', // Assuming you have user_id and created_at in resources table
            [user_id, oneHourAgo]
        );

        const resourceCount = parseInt(countResult.rows[0].count);

        if (resourceCount >= 5) {
            return res.status(429).json({ error: 'Too many resources created. Please try again later.' }); // 429 Too Many Requests
        }

        next();
    } catch (error) {
        console.error('Error checking resource creation rate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Create a new resource
router.post('/resources', sanitizeInput, resourceRateLimiter, validateResourceInput, resourceLogger, async (req, res) => {
    const { name, type, description, user_id } = req.body; //Include user_id
    try {
        const result = await pool.query(
            'INSERT INTO resources (name, type, description, user_id) VALUES ($1, $2, $3, $4) RETURNING *', //Include user_id
            [name, type, description, user_id]
        );
        res.status(201).json({ message: 'Resource created successfully', resource: result.rows[0] });
    } catch (error) {
        console.error('Error creating resource:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ... (rest of the routes remain the same)

module.exports = router;

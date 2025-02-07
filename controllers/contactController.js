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

// Middleware to validate task data
const validateTask = (req, res, next) => {
    const { title, description, status } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (status && !validStatuses.includes(status)) { //Make status optional with default pending
        return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    next();
};

// Middleware to log task actions
const taskLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Task action: ${req.method} ${req.url}`);
    next();
};

// Middleware to check if task exists
const checkTaskExists = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        next();
    } catch (error) {
        console.error('Error checking task:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Added Middleware: Input Sanitization
const sanitizeInput = (req, res, next) => {
    if (req.body.title) {
      req.body.title = req.body.title.trim();
      req.body.title = req.body.title.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    if (req.body.description) {
        req.body.description = req.body.description.trim();
        req.body.description = req.body.description.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
      }
    next();
  };

// Added Middleware: Task Rate Limiting (example: 5 tasks per minute per user)
const taskRateLimiter = async (req, res, next) => {
    const { user_id } = req.body; // Assuming you have user_id in the request body
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    try {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND created_at > $2', // Assuming you have user_id and created_at in tasks table
        [user_id, oneMinuteAgo]
      );
  
      const taskCount = parseInt(countResult.rows[0].count);
  
      if (taskCount >= 5) {
        return res.status(429).json({ error: 'Too many tasks. Please try again later.' }); // 429 Too Many Requests
      }
  
      next();
    } catch (error) {
      console.error('Error checking task rate:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };


// Create a new task
router.post('/tasks', sanitizeInput, taskRateLimiter, validateTask, async (req, res) => {
    const { title, description, status = 'pending', user_id } = req.body; // Default status to 'pending'
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, description, status, user_id) VALUES ($1, $2, $3, $4) RETURNING *', // Include user_id in insert
            [title, description, status, user_id]
        );
        res.status(201).json({ message: 'Task created successfully', task: result.rows[0] });
    } catch (error) {
        console.error('Error creating task:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ... (rest of the routes remain the same)

module.exports = router;

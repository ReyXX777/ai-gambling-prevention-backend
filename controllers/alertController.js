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
  if (!validStatuses.includes(read_status)) {
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

// Create a new notification
router.post('/', validateNotification, checkUserExists, async (req, res) => {
  const { user_id, message, read_status } = req.body;
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

// Get all notifications for a user
router.get('/user/:user_id', notificationLogger, async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY id ASC', [user_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single notification by ID
router.get('/:id', notificationLogger, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a notification by ID
router.put('/:id', validateNotification, async (req, res) => {
  const { id } = req.params;
  const { message, read_status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE notifications SET message = $1, read_status = $2 WHERE id = $3 RETURNING *',
      [message, read_status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a notification by ID
router.delete('/:id', notificationLogger, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

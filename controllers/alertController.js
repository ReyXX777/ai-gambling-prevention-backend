const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Ensure required environment variables are set
if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASSWORD || !process.env.DB_PORT) {
  console.error('Database environment variables are missing');
  process.exit(1);
}

// Set up PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware to validate alert data
const validateAlert = (req, res, next) => {
  const { title, message, type } = req.body;
  if (!title || !message || !type) {
    return res.status(400).json({ error: 'Title, message, and type are required' });
  }

  const validTypes = ['info', 'warning', 'error'];
  if (!validTypes.includes(type.toLowerCase())) {
    return res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
  }

  next();
};

// Create a new alert
router.post('/', validateAlert, async (req, res) => {
  const { title, message, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO alerts (title, message, type) VALUES ($1, $2, $3) RETURNING *',
      [title, message, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single alert by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an alert by ID
router.put('/:id', validateAlert, async (req, res) => {
  const { id } = req.params;
  const { title, message, type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE alerts SET title = $1, message = $2, type = $3 WHERE id = $4 RETURNING *',
      [title, message, type, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an alert by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

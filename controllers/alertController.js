// controllers/alertController.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Set up the PostgreSQL connection using environment variables
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'profile',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// Create a new alert
router.post('/', async (req, res) => {
  const { title, message, type } = req.body;
  if (!title || !message || !type) {
    return res.status(400).json({ error: 'Title, message, and type are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO alerts (title, message, type) VALUES ($1, $2, $3) RETURNING *',
      [title, message, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// Update an alert by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, message, type } = req.body;
  if (!title || !message || !type) {
    return res.status(400).json({ error: 'Title, message, and type are required' });
  }
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

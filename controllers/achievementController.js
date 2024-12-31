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

// Middleware to validate achievement data
const validateAchievement = (req, res, next) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  next();
};

// Create a new achievement
router.post('/', validateAchievement, async (req, res) => {
  const { title, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO achievements (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all achievements
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single achievement by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM achievements WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching achievement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an achievement by ID
router.put('/:id', validateAchievement, async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE achievements SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an achievement by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM achievements WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    res.status(200).json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

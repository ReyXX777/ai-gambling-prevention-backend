// controllers/achievementController.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Set up the PostgreSQL connection
const pool = new Pool({
  user: 'yourusername',
  host: 'localhost',
  database: 'yourdatabase',
  password: 'yourpassword',
  port: 5432,
});

// Create a new achievement
router.post('/achievements', async (req, res) => {
  const { title, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO achievements (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single achievement by ID
router.get('/achievements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM achievements WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an achievement by ID
router.put('/achievements/:id', async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Delete an achievement by ID
router.delete('/achievements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM achievements WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    res.status(200).json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

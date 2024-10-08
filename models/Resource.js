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

// Create a new resource
router.post('/resources', async (req, res) => {
  const { name, type, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO resources (name, type, description) VALUES ($1, $2, $3) RETURNING *',
      [name, type, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all resources
router.get('/resources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single resource by ID
router.get('/resources/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM resources WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a resource by ID
router.put('/resources/:id', async (req, res) => {
  const { id } = req.params;
  const { name, type, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE resources SET name = $1, type = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, type, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a resource by ID
router.delete('/resources/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM resources WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Set up the PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'yourusername',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'yourdatabase',
  password: process.env.DB_PASSWORD || 'yourpassword',
  port: process.env.DB_PORT || 5432,
});

// Create a new resource
router.post('/resources', async (req, res) => {
  const { name, description } = req.body;

  // Input validation
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO resources (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json({ message: 'Resource created successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error creating resource:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get all resources
router.get('/resources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources ORDER BY created_at DESC');
    res.status(200).json({ message: 'Resources retrieved successfully', resources: result.rows });
  } catch (error) {
    console.error('Error retrieving resources:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get a single resource by ID
router.get('/resources/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM resources WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    res.status(200).json({ message: 'Resource retrieved successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error retrieving resource:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update a resource by ID
router.put('/resources/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  // Input validation
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required.' });
  }

  try {
    const result = await pool.query(
      'UPDATE resources SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    res.status(200).json({ message: 'Resource updated successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error updating resource:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete a resource by ID
router.delete('/resources/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM resources WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    res.status(200).json({ message: 'Resource deleted successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error deleting resource:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;

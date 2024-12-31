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

// Create a new resource
router.post('/resources', validateResourceInput, async (req, res) => {
  const { name, type, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO resources (name, type, description) VALUES ($1, $2, $3) RETURNING *',
      [name, type, description]
    );
    res.status(201).json({ message: 'Resource created successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all resources
router.get('/resources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources');
    res.status(200).json({ resources: result.rows });
  } catch (error) {
    console.error('Error retrieving resources:', error);
    res.status(500).json({ error: 'Server error' });
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
    res.status(200).json({ resource: result.rows[0] });
  } catch (error) {
    console.error('Error retrieving resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a resource by ID
router.put('/resources/:id', validateResourceInput, async (req, res) => {
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
    res.status(200).json({ message: 'Resource updated successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

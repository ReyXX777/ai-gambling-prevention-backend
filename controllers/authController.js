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

// Middleware to validate comment data
const validateComment = (req, res, next) => {
  const { user_id, content } = req.body;
  if (!user_id || !content) {
    return res.status(400).json({ error: 'User ID and content are required' });
  }
  next();
};

// Middleware to log comment actions
const commentLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Comment action: ${req.method} ${req.url}`);
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

// Create a new comment
router.post('/', validateComment, checkUserExists, async (req, res) => {
  const { user_id, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (user_id, content) VALUES ($1, $2) RETURNING *',
      [user_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all comments
router.get('/', commentLogger, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM comments ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single comment by ID
router.get('/:id', commentLogger, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM comments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a comment by ID
router.put('/:id', validateComment, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const result = await pool.query(
      'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
      [content, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment by ID
router.delete('/:id', commentLogger, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM comments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

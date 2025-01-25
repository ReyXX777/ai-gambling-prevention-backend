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
  const { comment_text, achievement_id } = req.body;
  if (!comment_text || !achievement_id) {
    return res.status(400).json({ error: 'Comment text and achievement ID are required' });
  }
  next();
};

// Middleware to log incoming requests
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

// Middleware to check if achievement exists
const checkAchievementExists = async (req, res, next) => {
  const { achievement_id } = req.body;
  try {
    const result = await pool.query('SELECT * FROM achievements WHERE id = $1', [achievement_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    next();
  } catch (error) {
    console.error('Error checking achievement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new comment
router.post('/', validateComment, checkAchievementExists, async (req, res) => {
  const { comment_text, achievement_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (comment_text, achievement_id) VALUES ($1, $2) RETURNING *',
      [comment_text, achievement_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all comments for an achievement
router.get('/achievement/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM comments WHERE achievement_id = $1 ORDER BY id ASC', [id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single comment by ID
router.get('/:id', async (req, res) => {
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
  const { comment_text } = req.body;
  try {
    const result = await pool.query(
      'UPDATE comments SET comment_text = $1 WHERE id = $2 RETURNING *',
      [comment_text, id]
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
router.delete('/:id', async (req, res) => {
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

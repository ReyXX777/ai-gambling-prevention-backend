const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Set up PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'yourusername',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'yourdatabase',
  password: process.env.DB_PASSWORD || 'yourpassword',
  port: process.env.DB_PORT || 5432,
});

// Middleware to validate task data
const validateTask = (req, res, next) => {
  const { title, description, status } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const validStatuses = ['pending', 'in-progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  next();
};

// Middleware to log task actions
const taskLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Task action: ${req.method} ${req.url}`);
  next();
};

// Middleware to check if task exists
const checkTaskExists = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    next();
  } catch (error) {
    console.error('Error checking task:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new task
router.post('/tasks', validateTask, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status) VALUES ($1, $2, $3) RETURNING *',
      [title, description, status]
    );
    res.status(201).json({ message: 'Task created successfully', task: result.rows[0] });
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tasks
router.get('/tasks', taskLogger, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.status(200).json({ message: 'Tasks retrieved successfully', tasks: result.rows });
  } catch (error) {
    console.error('Error retrieving tasks:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single task by ID
router.get('/tasks/:id', taskLogger, checkTaskExists, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    res.status(200).json({ message: 'Task retrieved successfully', task: result.rows[0] });
  } catch (error) {
    console.error('Error retrieving task:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a task by ID
router.put('/tasks/:id', validateTask, checkTaskExists, async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3 WHERE id = $4 RETURNING *',
      [title, description, status, id]
    );
    res.status(200).json({ message: 'Task updated successfully', task: result.rows[0] });
  } catch (error) {
    console.error('Error updating task:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a task by ID
router.delete('/tasks/:id', taskLogger, checkTaskExists, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    res.status(200).json({ message: 'Task deleted successfully', task: result.rows[0] });
  } catch (error) {
    console.error('Error deleting task:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

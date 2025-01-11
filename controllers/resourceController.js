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

// Create a new user profile
router.post('/profiles', async (req, res) => {
  const { user_id, first_name, last_name, email, phone } = req.body;

  // Input validation
  if (!user_id || !first_name || !last_name || !email || !phone) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO user_profiles (user_id, first_name, last_name, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, first_name, last_name, email, phone]
    );
    res.status(201).json({ message: 'Profile created successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Error creating profile:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get all user profiles
router.get('/profiles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_profiles ORDER BY first_name ASC');
    res.status(200).json({ message: 'Profiles retrieved successfully', profiles: result.rows });
  } catch (error) {
    console.error('Error retrieving profiles:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get a single user profile by user ID
router.get('/profiles/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.status(200).json({ message: 'Profile retrieved successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Error retrieving profile:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update a user profile by user ID
router.put('/profiles/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { first_name, last_name, email, phone } = req.body;

  // Input validation
  if (!first_name || !last_name || !email || !phone) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    const result = await pool.query(
      'UPDATE user_profiles SET first_name = $1, last_name = $2, email = $3, phone = $4 WHERE user_id = $5 RETURNING *',
      [first_name, last_name, email, phone, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.status(200).json({ message: 'Profile updated successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete a user profile by user ID
router.delete('/profiles/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query('DELETE FROM user_profiles WHERE user_id = $1 RETURNING *', [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.status(200).json({ message: 'Profile deleted successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Error deleting profile:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;

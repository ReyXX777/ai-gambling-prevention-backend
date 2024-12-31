const express = require('express');
const { registerUser } = require('../controllers/userController'); // Ensure correct function import
const router = express.Router();

// POST route to register a user
router.post('/register', registerUser); // Using a descriptive function name

module.exports = router;

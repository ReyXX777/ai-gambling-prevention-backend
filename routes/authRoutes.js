const express = require('express');
const { registerUser } = require('../controllers/authController'); // Renaming the controller function to clarify its intent
const router = express.Router();

// POST route to register a new user
router.post('/register', registerUser); // Renaming to registerUser to make it clearer

module.exports = router;

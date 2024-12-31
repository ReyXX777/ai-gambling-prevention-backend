const express = require('express');
const { addContact } = require('../controllers/contactController'); // Updated function name for clarity
const router = express.Router();

// POST route to add a new contact
router.post('/add', addContact); // Using a more descriptive name for the route

module.exports = router;

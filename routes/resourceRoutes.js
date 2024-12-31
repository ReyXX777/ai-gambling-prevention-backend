const express = require('express');
const { createResource } = require('../controllers/resourceController'); // Updated function name for clarity
const router = express.Router();

// POST route to create a new resource
router.post('/create', createResource); // Using a more descriptive name for the route

module.exports = router;

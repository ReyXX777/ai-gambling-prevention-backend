const express = require('express');
const { createAlert } = require('../controllers/alertController');
const router = express.Router();

// POST route to create a new alert
router.post('/alerts', createAlert);

module.exports = router;

const express = require('express');
const { register } = require('../controllers/alertController');
const router = express.Router();

router.post('/register', register);

module.exports = router;

const express = require('express');
const { createAchievement } = require('../controllers/achievementController');
const router = express.Router();

// POST route to create a new achievement
router.post('/achievements', createAchievement);

module.exports = router;

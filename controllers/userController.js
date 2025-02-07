const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Please provide all required fields.' });
    }

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists.' });
        }

        // Create new user object
        user = new User({ name, email, password });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user to database
        await user.save();

        // Generate JWT token
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            msg: 'User registered successfully.',
            token,
            user: { id: user.id, name: user.name, email: user.email },
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ msg: 'Internal server error.' });
    }
};

// Login a user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide all required fields.' });
    }

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        // Generate JWT token
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            msg: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email },
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ msg: 'Internal server error.' });
    }
};

// Get logged-in user details
const getLoggedInUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).json({ msg: 'Internal server error.' });
    }
};

// Middleware for verifying JWT and attaching user ID to request
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: 'No token provided. Authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (error) {
        console.error('Invalid token:', error);
        res.status(401).json({ msg: 'Invalid token. Authorization denied.' });
    }
};

// Middleware to log authentication actions
const authLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Auth action: ${req.method} ${req.url}`);
    next();
};

// Middleware to validate email format
const validateEmail = (req, res, next) => {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ msg: 'Invalid email format.' });
    }
    next();
};

// Added Middleware: Input Sanitization
const sanitizeInput = (req, res, next) => {
    if (req.body.name) {
        req.body.name = req.body.name.trim();
        req.body.name = req.body.name.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    }
    if (req.body.email) {
        req.body.email = req.body.email.trim();
    }
    next();
};

// Added Middleware: Rate Limiting (example: 5 registrations per hour)
const registrationRateLimiter = async (req, res, next) => {
    // In a real application, you would use a database or caching mechanism to track registration attempts.
    // This is a simplified example using in-memory storage (not suitable for production).
    const registrations = []; // Replace with database logic
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentRegistrations = registrations.filter(reg => reg.timestamp > oneHourAgo);

    if (recentRegistrations.length >= 5) {
        return res.status(429).json({ msg: 'Too many registrations. Please try again later.' }); // 429 Too Many Requests
    }

    registrations.push({ email: req.body.email, timestamp: now }); // Replace with database insert

    next();
};


module.exports = {
    registerUser,
    loginUser,
    getLoggedInUser,
    verifyToken,
    authLogger,
    validateEmail,
    sanitizeInput,
    registrationRateLimiter,
};

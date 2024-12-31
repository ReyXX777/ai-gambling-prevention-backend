const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUser, findUserByEmail } = require('../models/User'); // Assuming these model functions exist
require('dotenv').config();

// Ensure required environment variables are set
if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET environment variable');
    process.exit(1);
}

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Email, password, and name are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Enforce password strength
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // Check if the user already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Hash the password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10; // Defaults to 10 rounds
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const user = await createUser({ email, password: passwordHash, name });

        // Generate a JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Respond with user data and token
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Error during user registration:', error.stack || error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

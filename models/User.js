const pool = require('../config/db');

// Input validation for creating a user
const validateUserInput = (user) => {
    const { email, passwordHash, name } = user;

    if (!email || !passwordHash || !name) {
        throw new Error('Email, password, and name are required.');
    }

    // Example of simple email validation (could be expanded)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format.');
    }
};

// Create a new user in the database
const createUser = async (user) => {
    try {
        // Validate input
        validateUserInput(user);

        const { email, passwordHash, name } = user;

        // Perform the database query
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [email, passwordHash, name]
        );

        // Return the created user (omit password hash for security)
        const createdUser = result.rows[0];
        const { password_hash, ...userWithoutPassword } = createdUser;
        return userWithoutPassword;

    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Error creating user: ' + error.message);
    }
};

module.exports = { createUser };

const pool = require('../config/db');

const createUser = async (user) => {
    const { email, passwordHash, name } = user;
    return await pool.query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *`,
        [email, passwordHash, name]
    );
};

module.exports = { createUser };

// Import required libraries and load environment variables
const { Pool } = require('pg');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'profile',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
});

// Test PostgreSQL connection
pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL");
        client.release();  // release the client after successful connection
    })
    .catch(err => console.error("Connection error", err.stack));

// Initialize Sequelize (if needed for ORM functionality)
const sequelize = new Sequelize(
    process.env.DB_NAME || 'profile',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'your_password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
    }
);

// Export both pool and Sequelize instance for usage in the app
module.exports = {
    pool,                       // For direct query access
    query: (text, params) => pool.query(text, params),  // Easy access for pool queries
    sequelize                    // For ORM functionality if Sequelize is used
};

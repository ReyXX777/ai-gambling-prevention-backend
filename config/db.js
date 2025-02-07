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
        console.log('Connected to PostgreSQL');
        client.release(); // Release the client after successful connection
    })
    .catch(err => console.error('PostgreSQL connection error:', err.stack));

// Initialize Sequelize for ORM functionality
const sequelize = new Sequelize(
    process.env.DB_NAME || 'profile',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'your_password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false, // Disable SQL query logging; enable if debugging is needed
    }
);

// Test Sequelize connection
sequelize.authenticate()
    .then(() => {
        console.log('Connected to PostgreSQL via Sequelize');
    })
    .catch(err => {
        console.error('Sequelize connection error:', err);
    });

// Added new component: Database health check function
const checkDatabaseHealth = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('Database health check: OK');
    } catch (error) {
        console.error('Database health check failed:', error);
    }
};

// Added new component: Database query logger middleware
const queryLogger = (req, res, next) => {
    const originalQuery = pool.query;
    pool.query = (text, params) => {
        console.log('Executing query:', text);
        return originalQuery(text, params);
    };
    next();
};

// Added new component: Connection pool metrics
const getConnectionPoolMetrics = () => {
    const totalConnections = pool.totalCount;
    const idleConnections = pool.idleCount;
    const waitingClients = pool.waitingCount;

    return {
        totalConnections,
        idleConnections,
        waitingClients,
    };
};

// Added new component:  Slow Query Logger
const slowQueryLogger = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        if (elapsedTime > 500) { // Example threshold: 500ms
            console.warn(`Slow query: ${req.originalUrl} took ${elapsedTime}ms`);
        }
    });

    next();
};


// Export both pool and Sequelize instance for usage in the app
module.exports = {
    pool, // For direct query access
    query: (text, params) => pool.query(text, params), // Helper for executing pool queries
    sequelize, // For ORM functionality
    checkDatabaseHealth, // Added new component
    queryLogger, // Added new component
    getConnectionPoolMetrics, // Added new component
    slowQueryLogger, // Added new component
};

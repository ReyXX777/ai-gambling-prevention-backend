const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path as necessary

// Define the Alert model
const Alert = sequelize.define('Alert', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false, // Ensure the message is required
        validate: {
            notEmpty: true, // Validate that the message is not empty
        },
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false, // Ensure the userId is required
        references: {
            model: 'Users', // Refers to the 'Users' table
            key: 'id', // Refers to the 'id' column in the 'Users' table
        },
        validate: {
            isInt: true, // Ensure the userId is an integer
        },
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Automatically set the current date if no date is provided
        validate: {
            isDate: true, // Ensure that the value is a valid date
        },
    },
    severity: {
        type: DataTypes.ENUM('low', 'medium', 'high'), // Added new field for alert severity
        defaultValue: 'medium', // Default severity is 'medium'
        allowNull: false,
        validate: {
            notEmpty: true, // Ensure the severity is not empty
        },
    },
    isRead: {
        type: DataTypes.BOOLEAN, // Added new field to track if the alert has been read
        defaultValue: false, // Default value is false (unread)
        allowNull: false,
    },
    alertType: { // Added new field for alert type (e.g., system, security, etc.)
        type: DataTypes.STRING,
        allowNull: true,
        validate:{
            notEmpty:true,
        }
    },
    metadata: { // Added new field for storing additional alert metadata (JSON format)
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    tableName: 'alerts', // The name of the table in the database
    timestamps: true, // Enable timestamps to automatically create createdAt and updatedAt fields
    paranoid: true, // Enable soft deletes, if you want to support them in the future
    underscored: true, // Optionally use snake_case for column names (e.g., user_id instead of userId)
});

// Associations
// If you want to set up associations with other models, you can define them like so:
Alert.belongsTo(User, { foreignKey: 'userId' }); // Assuming a 'User' model exists

module.exports = Alert;

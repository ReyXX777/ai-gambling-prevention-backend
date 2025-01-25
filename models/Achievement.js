const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path as necessary

// Define the Achievement model
const Achievement = sequelize.define('Achievement', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Ensure the title is not empty
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Ensure the description is not empty
    },
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Automatically set the current date if no date is provided
    validate: {
      isDate: true, // Ensure the date is a valid date
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Refers to the 'Users' table (the name of the related table)
      key: 'id', // Refers to the 'id' column in the 'Users' table
    },
    onDelete: 'CASCADE', // When a user is deleted, their related achievements should be deleted
    validate: {
      isInt: true, // Ensure the userId is an integer
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'archived'), // Added new field for achievement status
    defaultValue: 'pending', // Default status is 'pending'
    allowNull: false,
    validate: {
      notEmpty: true, // Ensure the status is not empty
    },
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'), // Added new field for achievement priority
    defaultValue: 'medium', // Default priority is 'medium'
    allowNull: false,
    validate: {
      notEmpty: true, // Ensure the priority is not empty
    },
  },
}, {
  tableName: 'achievements', // The name of the table in the database
  timestamps: true, // Enable timestamps (createdAt and updatedAt)
  paranoid: true, // Enable soft deletes, if needed
  underscored: true, // Use snake_case for column names in the database
});

module.exports = Achievement;

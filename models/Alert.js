const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path as necessary

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Name of the table in the database
      key: 'id',
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'alerts', // Name of the table in the database
  timestamps: false,
});

module.exports = Alert;

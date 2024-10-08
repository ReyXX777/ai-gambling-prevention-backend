const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path as necessary

const Achievement = sequelize.define('Achievement', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Name of the table in the database
      key: 'id',
    },
  },
}, {
  tableName: 'achievements', // Name of the table in the database
  timestamps: false,
});

module.exports = Achievement;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  type: { type: DataTypes.STRING, defaultValue: 'SOS_ALERT' },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED'), defaultValue: 'PENDING' },
  sentAt: { type: DataTypes.DATE, allowNull: true }
}, { underscored: true });

module.exports = Notification;
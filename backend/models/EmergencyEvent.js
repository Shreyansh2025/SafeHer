const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/** Timeline entries shown on the Guardian Web page. */
const EmergencyEvent = sequelize.define('EmergencyEvent', {
  type: { type: DataTypes.STRING(40), allowNull: false },
  label: { type: DataTypes.STRING(255), allowNull: false }
}, { underscored: true });

module.exports = EmergencyEvent;

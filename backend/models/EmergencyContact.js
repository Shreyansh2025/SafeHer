const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmergencyContact = sequelize.define('EmergencyContact', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  relation: { type: DataTypes.STRING, allowNull: false }
}, { underscored: true });

module.exports = EmergencyContact;
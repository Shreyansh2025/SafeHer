const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * One secure Guardian Web link per (emergency, contact).
 * The random token is what appears in https://<guardian-web>/e/<token>.
 * Emergency IDs are never used in the public URL.
 */
const GuardianLink = sequelize.define('GuardianLink', {
  token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },

  // Per-channel delivery status shown on the Guardian page
  whatsappStatus: { type: DataTypes.STRING(20), defaultValue: 'PENDING' },
  smsStatus: { type: DataTypes.STRING(20), defaultValue: 'NOT_AVAILABLE' },
  callStatus: { type: DataTypes.STRING(20), defaultValue: 'PENDING' }
}, { underscored: true });

module.exports = GuardianLink;

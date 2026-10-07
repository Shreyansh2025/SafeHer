const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Emergency = sequelize.define(
  "Emergency",
  {
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    triggerType: {
      type: DataTypes.ENUM("SOS_BUTTON", "SHAKE", "IOT", "VOICE", "SMARTWATCH"),
      allowNull: false,
      defaultValue: "SOS_BUTTON",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "RESOLVED", "CANCELLED"),
      defaultValue: "ACTIVE",
    },
    startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    endedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { underscored: true }
);

module.exports = Emergency;

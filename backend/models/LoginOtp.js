const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LoginOtp = sequelize.define(
  "LoginOtp",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    challengeId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      unique: true,
    },

    otpHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    lastSentAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "login_otps",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["expires_at"] },
    ],
  }
);

module.exports = LoginOtp;
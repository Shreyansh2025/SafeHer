const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Har user ka ek permanent secret token (QR ke link mein jaata hai)
const UserQr = sequelize.define(
  "UserQr",
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  },
  { underscored: true }
);

module.exports = UserQr;
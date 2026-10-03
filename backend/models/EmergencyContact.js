const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EmergencyContact = sequelize.define(
    "EmergencyContact",
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },

        relation: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        underscored: true,

        indexes: [
            {
                unique: true,
                fields: ["user_id", "phone"],
                name: "unique_user_emergency_contact_phone"
            }
        ]
    }
);

module.exports = EmergencyContact;
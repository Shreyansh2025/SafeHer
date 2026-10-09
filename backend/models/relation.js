const sequelize = require('../config/database');

const User = require('./User');
const EmergencyContact = require('./EmergencyContact');
const Emergency = require('./Emergency');
const Notification = require('./Notification');
const Admin = require('./Admin');
const GuardianLink = require('./GuardianLink');
const EmergencyEvent = require('./EmergencyEvent');
const LoginOtp = require('./LoginOtp');

User.hasMany(EmergencyContact, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
});

EmergencyContact.belongsTo(User, {
    foreignKey: 'userId'
});

User.hasMany(Emergency, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
});

Emergency.belongsTo(User, {
    foreignKey: 'userId'
});

Emergency.hasMany(Notification, {
    foreignKey: 'emergencyId',
    onDelete: 'CASCADE'
});

Notification.belongsTo(Emergency, {
    foreignKey: 'emergencyId'
});

EmergencyContact.hasMany(Notification, {
    foreignKey: 'contactId',
    onDelete: 'CASCADE'
});

Notification.belongsTo(EmergencyContact, {
    foreignKey: 'contactId'
});

// Guardian Web
Emergency.hasMany(GuardianLink, {
    foreignKey: 'emergencyId',
    onDelete: 'CASCADE'
});

GuardianLink.belongsTo(Emergency, {
    foreignKey: 'emergencyId'
});

EmergencyContact.hasMany(GuardianLink, {
    foreignKey: 'contactId',
    onDelete: 'CASCADE'
});

GuardianLink.belongsTo(EmergencyContact, {
    foreignKey: 'contactId'
});

Emergency.hasMany(EmergencyEvent, {
    foreignKey: 'emergencyId',
    onDelete: 'CASCADE'
});

EmergencyEvent.belongsTo(Emergency, {
    foreignKey: 'emergencyId'
});

// Login OTP
User.hasOne(LoginOtp, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
});

LoginOtp.belongsTo(User, {
    foreignKey: 'userId'
});

module.exports = {
    sequelize,
    User,
    EmergencyContact,
    Emergency,
    Notification,
    Admin,
    GuardianLink,
    EmergencyEvent,
    LoginOtp
};
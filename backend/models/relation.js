const sequelize = require('../config/database');

const User = require('./user');
const EmergencyContact = require('./EmergencyContact');
const Emergency = require('./Emergency');
const Notification = require('./Notification');
const Admin = require('./Admin');

// --- Foreign Key Relationships ---

User.hasMany(EmergencyContact, { foreignKey: 'userId', onDelete: 'CASCADE' });
EmergencyContact.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Emergency, { foreignKey: 'userId', onDelete: 'CASCADE' });
Emergency.belongsTo(User, { foreignKey: 'userId' });

Emergency.hasMany(Notification, { foreignKey: 'emergencyId', onDelete: 'CASCADE' });
Notification.belongsTo(Emergency, { foreignKey: 'emergencyId' });

EmergencyContact.hasMany(Notification, { foreignKey: 'contactId', onDelete: 'CASCADE' });
Notification.belongsTo(EmergencyContact, { foreignKey: 'contactId' });

sequelize.sync({ alter: true })
  .then(() => console.log('✅ SafeHer Tables synchronized successfully.'))
  .catch((err) => console.error('❌ Sync error:', err));

module.exports = {
  sequelize,
  User,
  EmergencyContact,
  Emergency,
  Notification,
  Admin
};
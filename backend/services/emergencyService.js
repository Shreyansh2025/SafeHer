const {Emergency, EmergencyContact,Notification} = require('../models/relation');

const createEmergency = async (userId,latitude, longitude , address) => {
    try {
        const emergency = await Emergency.create({
            userId,
            latitude,
            longitude,
            address
        });

        const contact  = await EmergencyContact.findAll({ where: { userId } });


        const notifications = contact.map(contact => ({
            emergencyId: emergency.id,
            contactId: contact.id,
            message: `URGENT SOS! I need help. Location: ${latitude}, ${longitude}`,
            type: 'SOS_ALERT',
            status: 'PENDING'

        }))

        if(notifications.length > 0) {
            await Notification.bulkCreate(notifications);
        }
        return emergency;


    } catch (error) {
        console.error('Error creating emergency:',error);
        throw error;
    }
};

const resolveEmergency = async (emergencyId ) => {
    try {
        const emergency = await Emergency.findByPk(emergencyId);

        if(!emergency) {
            throw new Error('Emergency not found');
        }
        emergency.status = 'RESOLVED';
        emergency.endedAt = new Date();

        await emergency.save();

        return emergency;
    } catch (error) {
        console.error('Error resolving emergency:',error);
        throw error;
    }
}

module.exports = {
    createEmergency,
    resolveEmergency
};

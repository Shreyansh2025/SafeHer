const Emergency = require('../models/Emergency');

const createEmergency = async (userId,latitude, longitude ,address) => {
    try {
        const emergency = await Emergency.create({
            userId,
            latitude,
            longitude
        });
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

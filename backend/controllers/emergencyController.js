const emergencyService = require('../services/emergencyService');

const trigger = async (req,res) => {
    try {
        const { userId, latitude, longitude } = req.body;

        if(!userId || !latitude || !longitude){
            return res.status(400).json({message: 'User ID, latitude, and longitude are required.'})
        }

        const emergency = await emergencyService.createEmergency(userId,latitude,longitude);

        res.status(201).json({message: 'SOS triggered successfully',emergency});
    } catch (error){
        res.status(500).json({ error: 'Failed to trigger SOS' });
    }
};

const resolve = async (req,res) => {
    try {
        const { id } = req.params;
        const emergency  = await emergencyService.resolveEmergency(id);

        res.status(200).json({message:'SOS resolved successfully', emergency});

    } catch (error){
        if(error.message === 'Emergency not found'){
            res.status(404).json({message: 'Emergency not found'});
        }
        res.status(500).json({ error: 'Failed to resolve SOS' });
    }
};

module.exports = {
    trigger,resolve
}
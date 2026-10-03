const emergencyService = require('../services/emergencyService');

const trigger = async (req,res) => {
    try {
        const { latitude, longitude } = req.body;
        // Get userId from authenticated user token
        const userId = req.user.id;

        if(!latitude || !longitude){
            return res.status(400).json({message: 'Latitude and longitude are required.'})
        }

        const emergency = await emergencyService.createEmergency(userId,latitude,longitude);

        res.status(201).json({message: 'SOS triggered successfully',emergency});
    } catch (error){
        res.status(500).json({ error: 'Failed to trigger SOS' });
    }
};

const getAll = async (req, res) => {
    try {
        const userId = req.user.id;
        const emergencies = await emergencyService.getAllEmergencies(userId);

        return res.status(200).json({
            success: true,
            message: 'Emergencies fetched successfully',
            data: emergencies
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch emergencies' });
    }
};

const resolve = async (req,res) => {
    try {
        const { id } = req.params;
        const emergency  = await emergencyService.resolveEmergency(id);

        return res.status(200).json({message:'SOS resolved successfully', emergency});

    } catch (error){
        if(error.message === 'Emergency not found'){
            return res.status(404).json({message: 'Emergency not found'});
        }
        return res.status(500).json({ error: 'Failed to resolve SOS' });
    }
};

module.exports = {
    trigger,
    getAll,
    resolve
}

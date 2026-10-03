const emergencyService = require('../services/emergencyService');

const trigger = async (req, res) => {
    try {

        const {
            latitude,
            longitude,
            address
        } = req.body;

        const userId = req.user.id;


        // Basic validation
        if (
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required.'
            });
        }


        const result =
            await emergencyService.createEmergency(
                userId,
                latitude,
                longitude,
                address
            );


        let message =
            'SOS triggered successfully. Emergency contacts were notified.';


        if (result.contactsNotified === 0) {

            if (result.notifications === 0) {

                message =
                    'SOS recorded, but no emergency contacts are configured.';

            } else {

                message =
                    'SOS recorded, but no emergency contact could be notified.';

            }

        } else if (
            result.contactsFailed > 0
        ) {

            message =
                'SOS triggered. Some emergency contacts were notified, but some notifications failed.';
        }


        return res.status(201).json({
            success: true,
            message,
            emergency: result
        });

    } catch (error) {

        console.error(
            '❌ Failed to trigger SOS:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to trigger SOS'
        });
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
        const userId = req.user.id;

        const emergency = await emergencyService.resolveEmergency(
            id,
            userId
        );

        return res.status(200).json({
            message: 'SOS resolved successfully',
            emergency
        });

    } catch (error){
        if(error.message === 'Emergency not found'){
            return res.status(404).json({
                message: 'Emergency not found'
            });
        }

        return res.status(500).json({
            error: 'Failed to resolve SOS'
        });
    }
};

module.exports = {
    trigger,
    getAll,
    resolve
}
const {
    Notification,
    Emergency,
    EmergencyContact
} = require('../models/relation');


const getAlertforContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const userId = req.user.id;

        // Verify that this contact belongs to the logged-in user
        const contact = await EmergencyContact.findOne({
            where: {
                id: contactId,
                userId: userId
            }
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Emergency contact not found or access denied'
            });
        }

        // Fetch notifications for this user's contact
        const alerts = await Notification.findAll({
            where: {
                contactId: contactId
            },
            include: [{
                model: Emergency,
                attributes: [
                    'latitude',
                    'longitude',
                    'address',
                    'status',
                    'startedAt'
                ]
            }],
            order: [
                ['createdAt', 'DESC']
            ]
        });

        return res.status(200).json({
            success: true,
            alerts
        });

    } catch (error) {
        console.error('Error fetching alerts:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications'
        });
    }
};


module.exports = {
    getAlertforContact
};
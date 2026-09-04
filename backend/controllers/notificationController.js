const {Notification,Emergency} = require('../models/relation');

const getAlertforContact = async (req,res) => {
    try {
        const { contactId } = req.params;
        const alerts = await Notification.findAll({ 
            where: { contactId },
            include: [{
                model: Emergency,
                attributes: ['latitude', 'longitude', 'address', 'status', 'startedAt'],
                order   : [['createdAt', 'DESC']]
            }]
        });

        res.status(200).json({ alerts });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

module.exports = {
    getAlertforContact
};


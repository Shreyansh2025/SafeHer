const {
    Emergency,
    EmergencyContact,
    Notification,
    User
} = require('../models/relation');


const {
    sendWhatsApp
} = require('./twilioService');


const {
    sendSMS
} = require('./vonageService');



/* =========================================================
   CREATE EMERGENCY
========================================================= */

const createEmergency = async (
    userId,
    latitude,
    longitude,
    address
) => {

    try {

        // ---------------------------------------------------------
        // GET USER
        // ---------------------------------------------------------

        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('User not found');
        }


        // ---------------------------------------------------------
        // CREATE EMERGENCY
        // ---------------------------------------------------------

        const emergency = await Emergency.create({
            userId,
            latitude,
            longitude,
            address
        });


        // ---------------------------------------------------------
        // GET EMERGENCY CONTACTS
        // ---------------------------------------------------------

        const contacts = await EmergencyContact.findAll({
            where: {
                userId
            }
        });


        // ---------------------------------------------------------
        // CREATE NOTIFICATION RECORDS
        // ---------------------------------------------------------

        const notificationData = contacts.map(contact => ({
            emergencyId: emergency.id,
            contactId: contact.id,
            message:
                `URGENT SOS! I need help. Location: ${latitude}, ${longitude}`,
            type: 'SOS_ALERT',
            status: 'PENDING'
        }));


        let notificationRecords = [];

        if (notificationData.length > 0) {
            notificationRecords =
                await Notification.bulkCreate(
                    notificationData
                );
        }


        // ---------------------------------------------------------
        // GOOGLE MAPS LINK
        // ---------------------------------------------------------

        const googleMapsLink =
            `https://maps.google.com/?q=${latitude},${longitude}`;


        // ---------------------------------------------------------
        // MESSAGE
        // ---------------------------------------------------------

        const message =
`🚨 EMERGENCY ALERT from ${user.name || 'SafeHer User'}!

I need help immediately.

📍 Location:
${googleMapsLink}

Please contact me immediately.

Sent from SafeHer`;


        // ---------------------------------------------------------
        // DELIVERY COUNTERS
        // ---------------------------------------------------------

        let whatsappSent = 0;
        let whatsappFailed = 0;

        let smsSent = 0;
        let smsFailed = 0;

        let contactsNotified = 0;
        let contactsFailed = 0;


        // ---------------------------------------------------------
        // SEND ALERTS
        // ---------------------------------------------------------

        for (const contact of contacts) {

            const notification =
                notificationRecords.find(
                    record =>
                        record.contactId === contact.id
                );


            let whatsappResult = {
                success: false,
                reason: 'Not attempted'
            };

            let smsResult = {
                success: false,
                reason: 'Not attempted'
            };


            // -----------------------------------------------------
            // INVALID PHONE
            // -----------------------------------------------------

            if (!contact.phone) {

                console.warn(
                    '⚠️ Contact has no phone number:',
                    contact.id
                );

            } else {

                // -------------------------------------------------
                // WHATSAPP
                // -------------------------------------------------

                try {

                    whatsappResult =
                        await sendWhatsApp(
                            contact.phone,
                            message,
                            user.name || 'SafeHer User',
                            googleMapsLink
                        );

                } catch (error) {

                    console.error(
                        '❌ WhatsApp exception:',
                        error.message
                    );

                    whatsappResult = {
                        success: false,
                        reason: error.message
                    };
                }


                if (whatsappResult.success) {
                    whatsappSent++;
                } else {
                    whatsappFailed++;
                }


                // -------------------------------------------------
                // SMS
                // -------------------------------------------------

                try {

                    smsResult =
                        await sendSMS(
                            contact.phone,
                            message
                        );

                } catch (error) {

                    console.error(
                        '❌ SMS exception:',
                        error.message
                    );

                    smsResult = {
                        success: false,
                        reason: error.message
                    };
                }


                if (smsResult.success) {
                    smsSent++;
                } else {
                    smsFailed++;
                }

            }


            // -----------------------------------------------------
            // UPDATE NOTIFICATION STATUS
            //
            // SENT = at least one channel succeeded
            // FAILED = both channels failed
            // -----------------------------------------------------

            const contactNotified =
                whatsappResult.success ||
                smsResult.success;


            if (contactNotified) {

                contactsNotified++;

                if (notification) {

                    await notification.update({
                        status: 'SENT',
                        sentAt: new Date()
                    });

                }

            } else {

                contactsFailed++;

                if (notification) {

                    await notification.update({
                        status: 'FAILED',
                        sentAt: null
                    });

                }

            }

        }


        // ---------------------------------------------------------
        // TOTALS
        // ---------------------------------------------------------

        const totalSent =
            whatsappSent + smsSent;

        const totalFailed =
            whatsappFailed + smsFailed;


        // ---------------------------------------------------------
        // LOG SUMMARY
        // ---------------------------------------------------------

        console.log(
            '\n📊 EMERGENCY ALERT SUMMARY'
        );

        console.log(
            `   👥 Contacts: ${contacts.length}`
        );

        console.log(
            `   ✅ Contacts notified: ${contactsNotified}`
        );

        console.log(
            `   ❌ Contacts failed: ${contactsFailed}`
        );

        console.log(
            `   💬 WhatsApp: ${whatsappSent} sent, ${whatsappFailed} failed`
        );

        console.log(
            `   📩 SMS: ${smsSent} sent, ${smsFailed} failed`
        );


        // ---------------------------------------------------------
        // RETURN
        // ---------------------------------------------------------

        return {

            emergency,

            notifications:
                notificationRecords.length,

            contactsNotified,

            contactsFailed,

            whatsappSent,

            whatsappFailed,

            smsSent,

            smsFailed,

            totalSent,

            totalFailed

        };


    } catch (error) {

        console.error(
            '❌ Error creating emergency:',
            error
        );

        throw error;
    }
};



/* =========================================================
   GET ALL EMERGENCIES
========================================================= */

const getAllEmergencies = async (
    userId
) => {

    try {

        const emergencies =
            await Emergency.findAll({

                where: {
                    userId
                },

                order: [
                    ['createdAt', 'DESC']
                ]

            });


        return emergencies;


    } catch (error) {

        console.error(
            '❌ Error fetching emergencies:',
            error
        );

        throw error;
    }
};



/* =========================================================
   RESOLVE EMERGENCY
========================================================= */

const resolveEmergency = async (
    emergencyId,
    userId
) => {

    try {

        const emergency =
            await Emergency.findOne({
                where: {
                    id: emergencyId,
                    userId: userId
                }
            });


        if (!emergency) {

            throw new Error(
                'Emergency not found'
            );
        }


        emergency.status =
            'RESOLVED';

        emergency.endedAt =
            new Date();


        await emergency.save();


        return emergency;


    } catch (error) {

        console.error(
            '❌ Error resolving emergency:',
            error
        );

        throw error;
    }
};



/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    createEmergency,

    getAllEmergencies,

    resolveEmergency

};
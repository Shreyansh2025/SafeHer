<<<<<<< HEAD
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

        // Get user details

        const user =
            await User.findByPk(userId);


        if (!user) {
            throw new Error(
                'User not found'
            );
        }


        // Create emergency record

        const emergency =
            await Emergency.create({

                userId,

                latitude,

                longitude,

                address

            });


        // Get user's emergency contacts

        const contacts =
            await EmergencyContact.findAll({

                where: {
                    userId
                }

            });


        // Create notification records

        const notifications =
            contacts.map(contact => ({

                emergencyId:
                    emergency.id,

                contactId:
                    contact.id,

                message:
                    `URGENT SOS! I need help. Location: ${latitude}, ${longitude}`,

                type:
                    'SOS_ALERT',

                status:
                    'PENDING'

            }));


        if (
            notifications.length > 0
        ) {

            await Notification.bulkCreate(
                notifications
            );
        }



        /* =====================================================
           GOOGLE MAPS LOCATION
        ===================================================== */

        const googleMapsLink =
            `https://maps.google.com/?q=${latitude},${longitude}`;



        /* =====================================================
           EMERGENCY MESSAGE

           Same message is used for:
           - Vonage SMS
           - logging
        ===================================================== */

        const message =
`🚨 EMERGENCY ALERT from ${user.name || 'SafeHer User'}!

I need help immediately.

📍 Location:
${googleMapsLink}

Please contact me immediately.

Sent from SafeHer`;



        /* =====================================================
           SEND ALERTS

           Twilio  → WhatsApp
           Vonage  → SMS

           IMPORTANT:
           This is the ONLY place where both providers
           are called.

           This prevents duplicate SOS sending.
        ===================================================== */

        console.log(
            `📱 Sending emergency alerts to ${contacts.length} contact(s)...`
        );


        let whatsappSent = 0;
        let whatsappFailed = 0;

        let smsSent = 0;
        let smsFailed = 0;


        for (
            const contact of contacts
        ) {

            if (
                !contact ||
                !contact.phone
            ) {

                console.warn(
                    '⚠️ Contact has no phone number:',
                    contact
                );

                whatsappFailed++;
                smsFailed++;

                continue;
            }


            console.log(
                `\n📱 Emergency contact: ${contact.phone}`
            );


            /* =================================================
               1. TWILIO → WHATSAPP
            ================================================= */

            const whatsappResult =
                await sendWhatsApp(
                    contact.phone,
                    message,
                    user.name || 'SafeHer User',
                    googleMapsLink
                );


            if (
                whatsappResult.success
            ) {

                whatsappSent++;

            } else {

                whatsappFailed++;

            }



            /* =================================================
               2. VONAGE → SMS
            ================================================= */

            const smsResult =
                await sendSMS(
                    contact.phone,
                    message
                );


            if (
                smsResult.success
            ) {

                smsSent++;

            } else {

                smsFailed++;

            }

        }



        /* =====================================================
           ALERT SUMMARY
        ===================================================== */

        console.log(
            '\n📊 EMERGENCY ALERT SUMMARY'
        );

        console.log(
            `   💬 WhatsApp: ${whatsappSent} sent, ${whatsappFailed} failed`
        );

        console.log(
            `   📩 SMS:      ${smsSent} sent, ${smsFailed} failed`
        );


        console.log(
            '✅ Emergency created'
        );



        /* =====================================================
           RETURN RESPONSE

           Keep smsSent / smsFailed so existing frontend
           does not break.

           WhatsApp results are also returned separately.
        ===================================================== */

        return {

            emergency,

            notifications:
                notifications.length,


            // WhatsApp

            whatsappSent,

            whatsappFailed,


            // SMS

            smsSent,

            smsFailed,


            // Total successful deliveries

            totalSent:
                whatsappSent + smsSent,


            // Total failed attempts

            totalFailed:
                whatsappFailed + smsFailed

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
    emergencyId
) => {

    try {

        const emergency =
            await Emergency.findByPk(
                emergencyId
            );


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


=======
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
>>>>>>> origin/main
        return emergency;


    } catch (error) {
<<<<<<< HEAD

        console.error(
            '❌ Error resolving emergency:',
            error
        );

=======
        console.error('Error creating emergency:',error);
>>>>>>> origin/main
        throw error;
    }
};

<<<<<<< HEAD


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    createEmergency,

    getAllEmergencies,

    resolveEmergency

};
=======
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
>>>>>>> origin/main

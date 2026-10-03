const twilio = require('twilio');

let twilioClient = null;


/* =========================================================
   INITIALIZE TWILIO
   Used for WhatsApp
========================================================= */

const initializeTwilio = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const contentSid = process.env.TWILIO_CONTENT_SID;

    if (!accountSid || !authToken || !phoneNumber || !contentSid) {
        console.warn('⚠️ Twilio configuration incomplete');

        if (!accountSid) {
            console.warn('   Missing TWILIO_ACCOUNT_SID');
        }

        if (!authToken) {
            console.warn('   Missing TWILIO_AUTH_TOKEN');
        }

        if (!phoneNumber) {
            console.warn('   Missing TWILIO_PHONE_NUMBER');
        }

        if (!contentSid) {
            console.warn('   Missing TWILIO_CONTENT_SID');
        }

        twilioClient = null;
        return null;
    }

    try {
        twilioClient = twilio(
            accountSid,
            authToken
        );

        console.log(
            '✅ Twilio initialized successfully'
        );

        console.log(
            '📱 Twilio Number:',
            phoneNumber
        );

        console.log(
            '📝 Twilio Content SID:',
            contentSid
        );

        return twilioClient;

    } catch (error) {

        console.error(
            '❌ Twilio initialization failed:',
            error.message
        );

        twilioClient = null;

        return null;
    }
};


/* =========================================================
   FORMAT PHONE NUMBER
========================================================= */

const formatPhoneNumber = (phone) => {

    if (!phone) {
        throw new Error(
            'Phone number is empty'
        );
    }

    let formattedPhone = String(phone)
        .trim()
        .replace(/[\s\-().]/g, '');

    // Already E.164
    // Example: +918871296211

    if (formattedPhone.startsWith('+')) {
        return formattedPhone;
    }

    // Indian number without +
    // Example: 918871296211

    if (
        formattedPhone.startsWith('91') &&
        formattedPhone.length === 12
    ) {
        return `+${formattedPhone}`;
    }

    // Indian number with leading zero
    // Example: 08871296211

    if (
        formattedPhone.startsWith('0')
    ) {
        formattedPhone =
            formattedPhone.substring(1);
    }

    // Indian 10-digit number
    // Example: 8871296211

    if (formattedPhone.length === 10) {
        return `+91${formattedPhone}`;
    }

    throw new Error(
        `Invalid phone number format: ${phone}`
    );
};


/* =========================================================
   SEND WHATSAPP USING TWILIO
========================================================= */

const sendWhatsApp = async (
    to,
    message,
    userName,
    googleMapsLink
) => {

    if (!twilioClient) {

        console.log(
            '⚠️ Twilio not initialized - WhatsApp not sent'
        );

        return {
            success: false,
            provider: 'twilio',
            channel: 'whatsapp',
            reason: 'Twilio not configured'
        };
    }

    try {

        const formattedPhone =
            formatPhoneNumber(to);

        const contentSid =
            process.env.TWILIO_CONTENT_SID;

        const twilioPhoneNumber =
            process.env.TWILIO_PHONE_NUMBER;

        if (!contentSid) {
            throw new Error(
                'TWILIO_CONTENT_SID is missing from .env'
            );
        }

        if (!twilioPhoneNumber) {
            throw new Error(
                'TWILIO_PHONE_NUMBER is missing from .env'
            );
        }

        console.log(
            '📤 Sending WhatsApp through Twilio...'
        );

        console.log(
            '   From:',
            twilioPhoneNumber
        );

        console.log(
            '   To:',
            formattedPhone
        );

        console.log(
            '   Content SID:',
            contentSid
        );


        /*
           Twilio template variables:

           {{1}} = userName
           {{2}} = Google Maps URL
        */

        const contentVariables =
            JSON.stringify({
                1: String(
                    userName || 'SafeHer User'
                ),

                2: String(
                    googleMapsLink || ''
                )
            });


        const result =
            await twilioClient.messages.create({

                contentSid,

                contentVariables,

                from:
                    `whatsapp:${twilioPhoneNumber}`,

                to:
                    `whatsapp:${formattedPhone}`
            });


        console.log(
            '✅ Twilio WhatsApp sent successfully!'
        );

        console.log(
            '   SID:',
            result.sid
        );

        console.log(
            '   Status:',
            result.status
        );


        return {

            success: true,

            provider: 'twilio',

            channel: 'whatsapp',

            sid: result.sid,

            status: result.status

        };

    } catch (error) {

        console.error(
            '❌ Twilio WhatsApp sending failed'
        );

        console.error(
            '   To:',
            to
        );

        console.error(
            '   Error:',
            error.message
        );

        if (error.code) {

            console.error(
                '   Twilio error code:',
                error.code
            );
        }

        if (error.status) {

            console.error(
                '   HTTP status:',
                error.status
            );
        }

        if (error.moreInfo) {

            console.error(
                '   More info:',
                error.moreInfo
            );
        }


        return {

            success: false,

            provider: 'twilio',

            channel: 'whatsapp',

            reason: error.message,

            code: error.code,

            status: error.status,

            moreInfo: error.moreInfo

        };
    }
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    initializeTwilio,
    formatPhoneNumber,
    sendWhatsApp
};
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config();


// =========================================================
// DATABASE
// =========================================================

const {
    sequelize
} = require('./models/relation');


// =========================================================
// PROVIDER INITIALIZATION
// =========================================================

// Twilio → WhatsApp

const {
    initializeTwilio
} = require('./services/twilioService');


// Vonage → SMS

const {
    initializeVonage
} = require('./services/vonageService');


// Initialize providers

initializeTwilio();

initializeVonage();


// =========================================================
// ROUTES
// =========================================================

const authRoute =
    require('./routes/authRoute');

const emergencyContactRoutes =
    require('./routes/emergencyContactRoutes');

const emergencyRoutes =
    require('./routes/emergencyRoutes');

const notificationRoutes =
    require('./routes/notificationRoutes');

const adminRoutes =
    require('./routes/adminRoutes');


// =========================================================
// APP
// =========================================================

const app = express();

const server =
    http.createServer(app);


// =========================================================
// SOCKET.IO
// =========================================================

const io =
    new Server(server, {

        cors: {

            origin: '*',

            methods: [
                'GET',
                'POST'
            ]

        }

    });


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
    express.json()
);


// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
    '/',
    (req, res) => {

        res.json({
            message:
                'SafeHer API is running correctly.'
        });

    }
);


// =========================================================
// ROUTES
// =========================================================

// Authentication

app.use(
    '/api',
    authRoute
);


// Emergency contacts

app.use(
    '/api/emergency-Contact',
    emergencyContactRoutes
);


// SOS

app.use(
    '/api/emergency',
    emergencyRoutes
);


// Notifications

app.use(
    '/api/notifications',
    notificationRoutes
);


// Admin

app.use(
    '/api/admin',
    adminRoutes
);


// =========================================================
// SOCKET.IO
// =========================================================

io.on(
    'connection',
    (socket) => {

        console.log(
            `📡 New device connected: ${socket.id}`
        );


        socket.on(
            'sendLocation',
            (data) => {

                console.log(
                    `📍 Location update from User ${data.userId}: ${data.latitude}, ${data.longitude}`
                );


                io.emit(
                    'receiveLocation',
                    data
                );

            }
        );


        socket.on(
            'disconnect',
            () => {

                console.log(
                    `❌ Device disconnected: ${socket.id}`
                );

            }
        );

    }
);


// =========================================================
// START SERVER
// =========================================================

const PORT =
    process.env.PORT || 3000;


server.listen(
    PORT,
    () => {

        console.log(
            `🚀 Server is running on port ${PORT}`
        );


        // Verify database connection

        sequelize.authenticate()

            .then(
                () =>
                    console.log(
                        '✅ Database connection established successfully.'
                    )
            )

            .catch(
                (err) =>
                    console.error(
                        '❌ Unable to connect to the database:',
                        err
                    )
            );

    }
);
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

require("dotenv").config();

// =========================================================
// DATABASE
// =========================================================

const { sequelize, Emergency } = require("./models/relation");

// =========================================================
// PROVIDER INITIALIZATION
// =========================================================

// Twilio → WhatsApp
const { initializeTwilio } = require("./services/twilioService");

// Vonage → SMS
const { initializeVonage } = require("./services/vonageService");

// =========================================================
// ROUTES
// =========================================================

const authRoute = require("./routes/authRoute");

const profileRoutes = require("./routes/profileRoutes");

const emergencyContactRoutes = require("./routes/emergencyContactRoutes");

const emergencyRoutes = require("./routes/emergencyRoutes");

const guardianRoutes = require("./routes/guardianRoutes");

const emergencyService = require("./services/emergencyService");

const guardianService = require("./services/guardianService");

const notificationRoutes = require("./routes/notificationRoutes");

const adminRoutes = require("./routes/adminRoutes");

// =========================================================
// APP
// =========================================================

const app = express();

const server = http.createServer(app);

// =========================================================
// SOCKET.IO
// =========================================================

const io = new Server(server, {
  cors: {
    origin: "*",

    methods: ["GET", "POST"],
  },
});

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(express.json());

// Lets emergencyService push "resolved" to guardian browsers
emergencyService.setIo(io);

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/", (req, res) => {
  res.json({
    message: "SafeHer API is running correctly.",
  });
});

// =========================================================
// ROUTES
// =========================================================

// Authentication

app.use("/api", authRoute);

// Emergency contacts

app.use("/api/emergency-Contact", emergencyContactRoutes);

// SOS

app.use("/api/emergency", emergencyRoutes);

// Notifications

app.use("/api/notifications", notificationRoutes);

// Admin

app.use("/api/admin", adminRoutes);

// Profile

app.use("/api/profile", profileRoutes);

// Guardian Web (PUBLIC, secured by secret token)

app.use("/api/guardian", guardianRoutes);

// =========================================================
// SOCKET.IO
// =========================================================

// Guardian Web: read-only connection authenticated by secret link token
io.use(async (socket, next) => {
  const guardianToken = socket.handshake.auth?.guardianToken;

  if (!guardianToken) {
    return next();
  }

  try {
    const link = await guardianService.validateToken(guardianToken);

    if (!link) {
      return next(new Error("Invalid or expired link"));
    }

    socket.guardian = { emergencyId: link.emergencyId };

    return next();
  } catch (error) {
    return next(new Error("Invalid or expired link"));
  }
});

io.use((socket, next) => {
  // Guardians are already authenticated above
  if (socket.guardian) {
    return next();
  }

  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  // Guardian Web viewers: join read-only room, no victim handlers.
  if (socket.guardian) {
    const guardianRoom = `guardian:${socket.guardian.emergencyId}`;

    socket.join(guardianRoom);

    socket.emit("guardian:joined");

    return;
  }

  console.log(
    `📡 Authenticated device connected: ${socket.id} | User ${socket.user.id}`,
  );

  socket.on("joinEmergency", async (emergencyId) => {
    try {
      const emergency = await Emergency.findOne({
        where: {
          id: emergencyId,
          userId: socket.user.id,
          status: "ACTIVE",
        },
      });

      if (!emergency) {
        console.log(
          `❌ User ${socket.user.id} denied access to Emergency ${emergencyId}`,
        );

        socket.emit("emergencyAccessDenied", {
          emergencyId,
        });

        return;
      }

      const room = `emergency:${emergencyId}`;

      socket.join(room);

      console.log(`✅ User ${socket.user.id} joined ${room}`);

      // Tell frontend that room join succeeded
      socket.emit("emergencyJoined", {
        emergencyId,
      });
    } catch (error) {
      console.error("❌ Emergency room error:", error);

      socket.emit("emergencyAccessDenied", {
        emergencyId,
      });
    }
  });
  socket.on("sendLocation", (data) => {
    const { emergencyId, latitude, longitude } = data || {};

    if (!emergencyId || latitude === undefined || longitude === undefined) {
      return;
    }

    const room = `emergency:${emergencyId}`;

    // User must actually be inside this emergency room
    if (!socket.rooms.has(room)) {
      console.log(
        `❌ User ${socket.user.id} attempted unauthorized location update`,
      );

      return;
    }

    console.log(
      `📍 Emergency ${emergencyId} | User ${socket.user.id}: ${latitude}, ${longitude}`,
    );

    // Guardian Web: save (throttled) + broadcast WITHOUT userId
    guardianService.handleLocationUpdate(emergencyId, latitude, longitude);

    io.to(`guardian:${emergencyId}`).emit("location:update", {
      latitude: Number(latitude),
      longitude: Number(longitude),
      timestamp: new Date().toISOString(),
    });

    io.to(room).emit("receiveLocation", {
      emergencyId,
      userId: socket.user.id,
      latitude,
      longitude,
    });
  });

  socket.on("disconnect", () => {
    console.log(`❌ Device disconnected: ${socket.id}`);
  });
});

// =========================================================
// START SERVER
// =========================================================

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // -------------------------------------------------
    // DATABASE CONNECTION
    // -------------------------------------------------

    await sequelize.authenticate();

    console.log("✅ Database connection established successfully.");

    // -------------------------------------------------
    // DATABASE SYNC
    // -------------------------------------------------

    await sequelize.sync();

    console.log("✅ Database models synchronized successfully.");

    // -------------------------------------------------
    // PROVIDER INITIALIZATION
    // -------------------------------------------------

    initializeTwilio();

    initializeVonage();

    console.log("✅ Notification providers initialized.");

    // -------------------------------------------------
    // START HTTP SERVER
    // -------------------------------------------------

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);

    process.exit(1);
  }
};

// =========================================================
// BOOTSTRAP
// =========================================================

startServer();

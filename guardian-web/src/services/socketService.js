import { io } from "socket.io-client";
import { SOCKET_URL, USE_MOCK } from "../config";

/**
 * connectToEmergency(token, handlers, start)
 * Returns a disconnect() function.
 *
 * Real mode: read-only Socket.IO connection authenticated by the secret
 * Guardian token. Server events:
 *   location:update          { latitude, longitude, accuracy?, timestamp }
 *   notification:update      { whatsapp, sms, voiceCall }
 *   timeline:event            { id, type, label, time }
 *   emergency:resolved        { status, endedAt }
 */
export function connectToEmergency(
  token,
  { onLocationUpdate, onNotificationUpdate, onTimelineEvent, onResolved },
  start
) {
  if (USE_MOCK) {
    let lat = start.latitude;
    let lng = start.longitude;

    const id = setInterval(() => {
      lat += 0.0002;
      lng += 0.00015;
      onLocationUpdate?.({
        latitude: lat,
        longitude: lng,
        accuracy: 8 + Math.round(Math.random() * 6),
        timestamp: new Date().toISOString(),
      });
    }, 4000);

    return () => clearInterval(id);
  }

  const socket = io(SOCKET_URL, {
    auth: { guardianToken: token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on("guardian:joined", (data) => {
    console.log("Guardian socket connected:", data?.emergencyId);
  });

  socket.on("location:update", (update) => {
    onLocationUpdate?.(update);
  });

  socket.on("notification:update", (update) => {
    onNotificationUpdate?.(update);
  });

  socket.on("timeline:event", (event) => {
    onTimelineEvent?.(event);
  });

  socket.on("emergency:resolved", (data) => {
    onResolved?.(data);
    // A resolved emergency must not keep a Guardian socket alive.
    socket.disconnect();
  });

  socket.on("connect_error", (error) => {
    console.warn("Guardian socket error:", error.message);
  });

  return () => socket.disconnect();
}

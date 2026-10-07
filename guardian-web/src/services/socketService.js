import { io } from "socket.io-client";
import { SOCKET_URL, USE_MOCK } from "../config";

/**
 * connectToEmergency(token, { onLocationUpdate, onResolved }, startState)
 * Returns a disconnect() function.
 *
 * Real mode: read-only Socket.IO connection authenticated with the secret
 * guardian token. Server events:
 *   location:update      { latitude, longitude, timestamp }
 *   emergency:resolved   { status, endedAt }
 */
export function connectToEmergency(
  token,
  { onLocationUpdate, onResolved },
  start
) {
  if (USE_MOCK) {
    let lat = start.latitude;
    let lng = start.longitude;

    const id = setInterval(() => {
      lat += 0.0002;
      lng += 0.00015;
      onLocationUpdate({
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
  });

  socket.on("location:update", (u) => onLocationUpdate?.(u));
  socket.on("emergency:resolved", (d) => onResolved?.(d));
  socket.on("connect_error", (e) =>
    console.warn("Guardian socket error:", e.message)
  );

  return () => socket.disconnect();
}

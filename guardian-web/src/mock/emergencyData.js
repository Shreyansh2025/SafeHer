const base = {
  emergencyId: "105",
  userName: "Shreyansh",
  triggerType: "SOS_BUTTON", // SOS_BUTTON | SHAKE | IOT | VOICE | SMARTWATCH
  latitude: 22.7196,
  longitude: 75.8577,
  locationAccuracy: 10,
  startedAt: "2026-10-07T22:42:11",
  lastUpdated: "2026-10-07T22:43:12",
  endedAt: null,
  contact: { name: "Mother", phone: "+919876543210" },
  notifications: {
    whatsapp: "SENT", // SENT | FAILED | PENDING | NOT_AVAILABLE
    sms: "SENT",
    voiceCall: "NOT_AVAILABLE",
  },
};

// Key = token. Real backend mein ye random secure token hoga.
export const mockEmergencies = {
  ABC123: { ...base, status: "ACTIVE" },
  RESOLVED123: {
    ...base,
    status: "RESOLVED",
    endedAt: "2026-10-07T22:55:00",
  },
  CANCELLED123: {
    ...base,
    status: "CANCELLED",
    endedAt: "2026-10-07T22:44:00",
  },
};
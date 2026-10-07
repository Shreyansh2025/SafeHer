export const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

export const formatTimeFull = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "—";

export const TRIGGER_LABELS = {
  SOS_BUTTON: "SOS Button",
  SHAKE: "Shake",
  IOT: "IoT Device",
  VOICE: "Voice",
  SMARTWATCH: "Smartwatch",
};

export const triggerLabel = (type) => TRIGGER_LABELS[type] || type || "Unknown";
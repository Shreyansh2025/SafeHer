// Robust shake detector shared by foreground and background listeners.
// Accelerometer values include gravity, so a fixed total-magnitude threshold
// can miss real shakes. This detector looks for rapid vector changes instead.
export const createShakeDetector = ({
  onShake,
  deltaThreshold = 0.78,
  hitWindowMs = 1400,
  requiredHits = 2,
  cooldownMs = 7000,
} = {}) => {
  let previous = null;
  let hits = [];
  let lastTriggerAt = 0;

  return ({ x, y, z } = {}) => {
    const current = { x: Number(x), y: Number(y), z: Number(z) };
    if (![current.x, current.y, current.z].every(Number.isFinite)) return;

    const now = Date.now();
    if (previous) {
      const delta = Math.sqrt(
        (current.x - previous.x) ** 2 +
        (current.y - previous.y) ** 2 +
        (current.z - previous.z) ** 2
      );
      const magnitude = Math.sqrt(current.x ** 2 + current.y ** 2 + current.z ** 2);
      const suddenMovement = delta >= deltaThreshold || Math.abs(magnitude - 1) >= 0.95;

      hits = hits.filter((timestamp) => now - timestamp <= hitWindowMs);
      if (suddenMovement) hits.push(now);

      if (hits.length >= requiredHits && now - lastTriggerAt >= cooldownMs) {
        lastTriggerAt = now;
        hits = [];
        onShake?.();
      }
    }

    previous = current;
  };
};

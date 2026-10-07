import { mockEmergencies } from "../mock/emergencyData";
import { mockTimeline } from "../mock/timelineData";
import { API_URL, USE_MOCK } from "../config";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const notFound = () => {
  const err = new Error("Emergency not found");
  err.code = "NOT_FOUND";
  return err;
};

/* ---------------- REAL BACKEND ----------------
   GET {API_URL}/guardian/emergency/:token
   -> { success, data: { ...emergency, timeline: [...] } }
   One request feeds both the emergency and the timeline, so we
   de-duplicate concurrent calls with a short-lived promise cache. */
const inflight = new Map();

function fetchGuardian(token) {
  if (!inflight.has(token)) {
    const p = fetch(`${API_URL}/guardian/emergency/${encodeURIComponent(token)}`, {
      headers: { Accept: "application/json" },
    }).then(async (res) => {
      if (res.status === 404) throw notFound();
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      return json.data;
    });

    inflight.set(token, p);
    setTimeout(() => inflight.delete(token), 3000);
    p.catch(() => inflight.delete(token));
  }
  return inflight.get(token);
}

/* ---------------- PUBLIC API (used by UI) ---------------- */

export async function getEmergencyByToken(token) {
  if (USE_MOCK) {
    await wait(400);
    const data = mockEmergencies[token];
    if (!data) throw notFound();
    return data;
  }
  const { timeline, ...emergency } = await fetchGuardian(token);
  return emergency;
}

export async function getTimelineByToken(token) {
  if (USE_MOCK) {
    await wait(200);
    return mockEmergencies[token] ? mockTimeline : [];
  }
  const data = await fetchGuardian(token);
  return data.timeline || [];
}

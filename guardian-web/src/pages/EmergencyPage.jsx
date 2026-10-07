import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getEmergencyByToken,
  getTimelineByToken,
} from "../services/emergencyService";
import { connectToEmergency } from "../services/socketService";
import EmergencyHeader from "../components/EmergencyHeader";
import StatusCard from "../components/StatusCard";
import LocationMap from "../components/LocationMap";
import EmergencyContact from "../components/EmergencyContact";
import NotificationStatus from "../components/NotificationStatus";
import Timeline from "../components/Timeline";
import EmergencyDetails from "../components/EmergencyDetails";
import NotFoundPage from "./NotFoundPage";

export default function EmergencyPage() {
  const { token } = useParams();
  const [emergency, setEmergency] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [live, setLive] = useState(null);
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setState("loading");
    setLive(null);

    Promise.all([getEmergencyByToken(token), getTimelineByToken(token)])
      .then(([data, timelineData]) => {
        if (cancelled) return;
        setEmergency(data);
        setTimeline(timelineData);
        setState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setState(error.code === "NOT_FOUND" ? "notfound" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  useEffect(() => {
    if (state !== "ready" || !emergency || emergency.status !== "ACTIVE") {
      return undefined;
    }

    return connectToEmergency(
      token,
      {
        onLocationUpdate: (update) => {
          setLive((previous) => ({
            ...(previous || {}),
            latitude: update.latitude,
            longitude: update.longitude,
            ...(update.accuracy != null
              ? { locationAccuracy: update.accuracy }
              : {}),
            lastUpdated: update.timestamp,
          }));
        },

        onNotificationUpdate: (update) => {
          setLive((previous) => ({
            ...(previous || {}),
            notifications: {
              ...(emergency.notifications || {}),
              ...(previous?.notifications || {}),
              ...update,
            },
          }));
        },

        onTimelineEvent: (event) => {
          setTimeline((previous) => {
            const eventKey = `${event.id || ""}|${event.type || ""}|${event.time || ""}|${event.label || ""}`;
            const exists = previous.some(
              (item) =>
                `${item.id || ""}|${item.type || ""}|${item.time || ""}|${item.label || ""}` ===
                eventKey,
            );

            if (exists) return previous;
            return [...previous, event];
          });
        },

        onResolved: (data) => {
          const resolvedAt = data?.endedAt || new Date().toISOString();

          setEmergency((previous) =>
            previous
              ? {
                  ...previous,
                  status: "RESOLVED",
                  endedAt: resolvedAt,
                }
              : previous,
          );

          setLive((previous) => ({
            ...(previous || {}),
            status: "RESOLVED",
            endedAt: resolvedAt,
          }));
        },
      },
      emergency,
    );
  }, [state, emergency, token]);

  if (state === "loading") return <p className="center-msg">Loading...</p>;
  if (state === "notfound") return <NotFoundPage />;

  if (state === "error") {
    return (
      <div className="center-msg">
        <h2>Couldn't load the emergency</h2>
        <p>Please check your internet connection and try again.</p>
        <button
          className="btn btn-outline"
          onClick={() => setAttempt((number) => number + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  const current = {
    ...emergency,
    ...(live || {}),
    notifications: {
      ...(emergency.notifications || {}),
      ...(live?.notifications || {}),
    },
  };

  return (
    <div className="page">
      <EmergencyHeader />
      <main className="container">
        <StatusCard emergency={current} />
        <LocationMap
          latitude={current.latitude}
          longitude={current.longitude}
          accuracy={current.locationAccuracy}
          lastUpdated={current.lastUpdated}
          status={current.status}
        />
        <EmergencyContact contact={current.contact} />
        <NotificationStatus notifications={current.notifications} />
        <Timeline items={timeline} />
        <EmergencyDetails emergency={current} />
      </main>
    </div>
  );
}

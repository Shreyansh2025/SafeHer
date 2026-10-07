import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEmergencyByToken, getTimelineByToken } from "../services/emergencyService";
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
  const [live, setLive] = useState(null); // updates pushed over the socket
  const [state, setState] = useState("loading"); // loading | ready | notfound | error
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState("loading");
    setLive(null);
    Promise.all([getEmergencyByToken(token), getTimelineByToken(token)])
      .then(([data, tl]) => {
        setEmergency(data);
        setTimeline(tl);
        setState("ready");
      })
      .catch((err) => setState(err.code === "NOT_FOUND" ? "notfound" : "error"));
  }, [token, attempt]);

  // Live updates only while the emergency is ACTIVE
  useEffect(() => {
    if (state !== "ready" || emergency.status !== "ACTIVE") return;
    return connectToEmergency(
      token,
      {
        onLocationUpdate: (u) =>
          setLive((prev) => ({
            ...prev,
            latitude: u.latitude,
            longitude: u.longitude,
            ...(u.accuracy != null && { locationAccuracy: u.accuracy }),
            lastUpdated: u.timestamp,
          })),
        onResolved: (d) =>
          setLive((prev) => ({ ...prev, status: "RESOLVED", endedAt: d?.endedAt })),
      },
      emergency
    );
  }, [state, emergency, token]);

  if (state === "loading") return <p className="center-msg">Loading...</p>;
  if (state === "notfound") return <NotFoundPage />;
  if (state === "error")
    return (
      <div className="center-msg">
        <h2>Couldn't load the emergency</h2>
        <p>Please check your internet connection and try again.</p>
        <button className="btn btn-outline" onClick={() => setAttempt((n) => n + 1)}>
          Retry
        </button>
      </div>
    );

  const current = { ...emergency, ...live };

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

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { googleMapsUrl, formatCoord } from "../services/locationService";
import { formatTimeFull } from "../utils/format";

// Emoji marker (Vite mein default Leaflet icon ki image toot jaati hai)
const victimIcon = L.divIcon({
  className: "victim-marker",
  html: "📍",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

function FollowMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position);
  }, [position[0], position[1]]); // eslint-disable-line
  return null;
}

export default function LocationMap({ latitude, longitude, accuracy, lastUpdated, status }) {
  const position = [latitude, longitude];
  const isActive = status === "ACTIVE";

  return (
    <section className="card">
      <div className="card-head">
        <h2>Live Location</h2>
        <span className={`pill ${isActive ? "pill-live" : "pill-off"}`}>
          {isActive ? "● LIVE" : "Last known"}
        </span>
      </div>

      {!isActive && (
        <p className="muted-note">
          Showing last known location. This emergency is no longer active.
        </p>
      )}

      <div className="map-box">
        <MapContainer center={position} zoom={16} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={victimIcon}>
            <Popup>📍 Victim</Popup>
          </Marker>
          {isActive && <FollowMarker position={position} />}
        </MapContainer>
      </div>

      <dl className="loc-grid">
        <div><dt>Latitude</dt><dd>{formatCoord(latitude)}</dd></div>
        <div><dt>Longitude</dt><dd>{formatCoord(longitude)}</dd></div>
        <div><dt>Last Updated</dt><dd>{formatTimeFull(lastUpdated)}</dd></div>
        <div><dt>Accuracy</dt><dd>{accuracy ? `${accuracy}m` : "—"}</dd></div>
      </dl>

      <a className="btn btn-primary" href={googleMapsUrl(latitude, longitude)} target="_blank" rel="noopener noreferrer">
        Open in Google Maps
      </a>
    </section>
  );
}
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Loading from "./Loading/Loading";

export default function Map({ address }) {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const myIcon = L.icon({
    iconUrl: "/images/logo.png",
    iconSize: [60, 48],
    iconAnchor: [20, 41],
  });

  useEffect(() => {
    if (!address || !mapRef.current) return;

    const match = address
      .trim()
      .match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);

    if (!match) {
      console.error("Invalid coords:", address);
      return;
    }

    const lat = Number(match[1]);
    const lon = Number(match[3]);

    setLoading(true);
    mapRef.current.innerHTML = "";

    const map = L.map(mapRef.current).setView([lat, lon], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.marker([lat, lon], { icon: myIcon })
      .addTo(map)
      .bindPopup(
        `<a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${lat},${lon}`
        )}" target="_blank" rel="noopener noreferrer">Navigeren</a>`
      )
      .openPopup();

    setLoading(false);

    return () => map.remove();
  }, [address]);

  return (
    <div style={{ position: "relative", height: "300px", width: "100%" }}>
      {loading && <Loading innerHTML="Loading map" />}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

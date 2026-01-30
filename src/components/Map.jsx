import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Loading from "./Loading/Loading";

export default function Map({ address }) {
  const myIcon = L.icon({
    iconUrl: "/images/logo.png",
    iconSize: [60, 48],
    iconAnchor: [20, 41],
  });

  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !mapRef.current) return;

    let isMounted = true;
    const mapContainer = mapRef.current;

    mapContainer.innerHTML = ""; // reset map container
    setLoading(true);

    const map = L.map(mapContainer).setView([0, 0], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address,
      )}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data || !data.length) return;

        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        map.setView([lat, lon], 15);
        L.marker([lat, lon], { icon: myIcon })
          .addTo(map)
          .bindPopup(
            `<a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank">Navigate</a>`,
            {
              className: "leaflet-popup-navigate",
            },
          )
          .openPopup();

        setLoading(false); // finished loading
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      map.remove();
    };
  }, [address]);

  return (
    <div style={{ position: "relative", height: "300px", width: "100%" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(255,255,255,0.7)",
            zIndex: 1000,
          }}
        >
        <Loading innerHTML={"Loading map"}/>
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

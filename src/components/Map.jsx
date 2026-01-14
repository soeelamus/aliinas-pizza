import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Map({ address }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!address || !mapRef.current) return;

    let isMounted = true; // voorkomt updates na unmount
    const mapContainer = mapRef.current;

    // reset map container
    mapContainer.innerHTML = "";

    const map = L.map(mapContainer).setView([0, 0], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    )
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !data || !data.length) return;

        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        map.setView([lat, lon], 15);

        L.marker([lat, lon])
          .addTo(map)
          .bindPopup(
            `<a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank">Navigeren</a>`
          )
          .openPopup();
      })
      .catch(console.error);

    return () => {
      isMounted = false;
      map.remove(); // cleanup bij unmount
    };
  }, [address]);

  return <div className="event-map" ref={mapRef} style={{ height: "300px", width: "100%" }} />;
}

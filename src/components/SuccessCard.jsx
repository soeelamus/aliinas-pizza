import React, { useMemo } from "react";
import "../assets/css/kitchen.css";
import Map from "./Map";
import Loading from "./Loading/Loading";

export default function Success({ order }) {
  // Guard: order kan even null zijn tijdens laden
  if (!order) return <Loading innerHTML={"Bestelling laden"} />;

  // Items parser (zoals je had)
  function parseItems(itemsString) {
    if (!itemsString) return [];

    return itemsString
      .split(",")
      .map((item) => item.trim())
      .map((item) => {
        const match = item.match(/^(\d+)\s*x\s*(.+)$/i);
        if (!match) return null;

        return {
          quantity: Number(match[1]),
          name: match[2].trim(),
        };
      })
      .filter(Boolean);
  }

  // ✅ ANDROID SAFE: location uit localStorage kan null/invalid zijn
  const location = useMemo(() => {
    try {
      const raw = localStorage.getItem("location");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("❌ location parse failed:", e);
      return null;
    }
  }, []);

  // Veilig afleiden
  const pickupAddress = location?.address;
  const pickupMapCoords = location?.website;
  const items = useMemo(() => parseItems(order.items), [order.items]);

  return (
    <div className="success-details">
      <h3>✅ Bedankt, {order.customerName || "!"}</h3>

      <p>
        Je kan je bestelling vandaag ophalen{" "}
        {order.pickupTime ? (
          <>
            om <strong> {order.pickupTime}</strong>
          </>
        ) : null}
        <br />
        Ophalen: <strong>{pickupAddress}</strong>
      </p>
      <p>Er werd een bevestigingsmail verzonden. Controleer ook je spam folder</p>

      {pickupMapCoords ? (
        <div id="event-map" className="event-map">
          <Map address={pickupMapCoords} />
        </div>
      ) : null}

      <br />

      <h4 className="success-total">Bestelling</h4>

      {items.length ? (
        items.map((item, index) => (
          <li key={index} className="success-row">
            <span className="success-name">{item.name}</span>
            <span className="success-qty">{item.quantity}x</span>
          </li>
        ))
      ) : (
        <p style={{ opacity: 0.8 }}>Geen items gevonden.</p>
      )}

      <h4 className="success-total">Totaal: €{Number(order.total || 0).toFixed(2)}</h4>

      {order.customerNotes ? (
        <p className="success-notes">Notes: {order.customerNotes}</p>
      ) : null}
    </div>
  );
}

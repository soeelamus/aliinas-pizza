import React, { useState } from "react";
import "../assets/css/kitchen.css";
import Map from "./Map";

export default function Success({ order }) {
  if (!order) return <p>⏳ Loading order details…</p>;

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

  // Get location
  const location = JSON.parse(sessionStorage.getItem("location"));

  return (
    <div className="success-details">
      <h3>✅ Bedankt, {order.customerName}!</h3>
      <p>
        Je kan je bestelling vandaag ophalen om
        <strong> {order.pickupTime}</strong>
        <br />
        Ophalen: <strong>{location.address}</strong>
      </p>
      {location.address && (
        <div id="event-map" className="event-map">
          <Map address={location.address} />
        </div>
      )}
      <br />
      <h4 className="success-total">Bestelling</h4>
      {parseItems(order.items).map((item, index) => (
        <li key={index} className="success-row">
          <span className="success-name">{item.name}</span>
          <span className="success-qty">{item.quantity}x</span>
        </li>
      ))}
      <h4 className="success-total">Totaal: €{order.total}</h4>
      {order.customerNotes && (
        <p className="success-notes">Notes: {order.customerNotes}</p>
      )}
    </div>
  );
}

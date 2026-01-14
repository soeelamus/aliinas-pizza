import React, { useState } from "react";
import "../assets/css/kitchen.css";

export default function Success({ order }) {
  if (!order) return <p>⏳ Loading order details…</p>;

  function parseItems(itemsString) {
    if (!itemsString) return [];
    return itemsString
      .split(",")
      .map((item) => item.trim())
      .map((item) => {
        const match = item.match(/^(\d+)x\s*(.+)$/i);
        if (!match) return null;
        return {
          quantity: Number(match[1]),
          product: {
            name: match[2].trim(),
          },
        };
      })
      .filter(Boolean);
  }

  return (
    <div className="success-details">
      <h2>✅ Bedankt, {order.customerName}!</h2>
      <p>
        Je kan je bestelling vandaag ophalen om
        <strong> {order.pickupTime}</strong>
      </p>
      <div className="success-box">
        {parseItems(order.items).map((pizzas, i) => {
          const pizza = pizzas.product;
          return (
            <div className="pizzas" key={i}>
              <div className="pizzas list">
                <div className="pizza-item">
                  <span className="pizza-name">{pizza.name}</span>
                  <span className="pizza-qty">{pizza.quantity}x</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h3>Totaal: €{order.total}</h3>

      {order.customernotes && (
        <p className="pizzas list">Notes: {order.customernotes}</p>
      )}
    </div>
  );
}

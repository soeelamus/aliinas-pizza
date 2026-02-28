import { useState } from "react";
import { PickupCountdown } from "./PickupCountdown";

export default function Order({ order, onStatusChange, updatingId, currentTime }) {
  const [isCollapsed, setIsCollapsed] = useState(true); // ✅ default open (zet op false als je default dicht wil)

  // ✅ PickupCountdown met fallback
  const countdown = PickupCountdown(order.pickuptime) || {
    hours: 0,
    minutes: 0,
    pickupTimeFormatted: order.pickuptime || "Onbekend",
    isRed: order.pickuptime === "ASAP",
    isOrange: false,
  };

  // ✅ Parse pizza items
  const pizzas =
    order.items
      ?.split(",")
      .map((item) => item.trim())
      .map((item) => {
        const match = item.match(/^(\d+)\s*x\s*(.+)$/i);
        return match ? { quantity: Number(match[1]), name: match[2].trim() } : null;
      })
      .filter(Boolean) || [];

  const handleClick = (newStatus) => onStatusChange(order.id, newStatus);

  const toggle = () => setIsCollapsed((v) => !v);

  return (
    <li
      className={`kitchen-order
        ${order.status === "done" ? "done" : ""}
        ${order.status === "pickedup" ? "pickedup" : ""}
        ${countdown.isRed && order.status === "new" ? "urgent-red" : ""}
        ${countdown.isOrange && order.status === "new" ? "urgent-orange" : ""}
      `}
    >
      {/* Heading (click to toggle details) */}
      <div className="heading-box" onClick={toggle} style={{ cursor: "pointer" }}>
        <ul className="heading">
          <li>{order.customername?.toUpperCase() || "Onbekend"}</li>
          <li>
            <strong className={order.pickuptime === "ASAP" ? "urgent-red" : ""}>
              {countdown.pickupTimeFormatted}
            </strong>
          </li>
          {order.status !== "pickedup" && order.pickuptime !== "ASAP" && (
            <li>
              {`${countdown.hours.toString().padStart(2, "0")}:${countdown.minutes
                .toString()
                .padStart(2, "0")}`}
            </li>
          )}
        </ul>
      </div>

      {/* Details */}
      <div
        className="orders--info"
        style={{ display: isCollapsed ? "block" : "none" }}
        onClick={(e) => e.stopPropagation()} // ✅ klikken in info togglet niet
      >
        {/* Pizza items */}
        {pizzas.map((pizza, i) => (
          <div className="pizzas" key={i}>
            <label className="pizza-item">
              <input type="checkbox" onClick={(e) => e.stopPropagation()} />
              <span className="pizza-qty">{pizza.quantity}x</span>
              <span className="pizza-name">{pizza.name}</span>
            </label>
          </div>
        ))}

        {/* Customer notes */}
        {order.customernotes && (
          <span className="pizzas list">Notes: {order.customernotes}</span>
        )}

        {/* Action buttons */}
        {order.status === "new" && (
          <button
            className="btn-purple"
            onClick={(e) => {
              e.stopPropagation();
              handleClick("done");
            }}
            disabled={updatingId === order.id}
          >
            {updatingId === order.id ? "Updating..." : "Done"}
          </button>
        )}

        {order.status === "done" && (
          <button
            className="btn-purple"
            onClick={(e) => {
              e.stopPropagation();
              handleClick("pickedup");
            }}
            disabled={updatingId === order.id}
          >
            {updatingId === order.id ? "Updating..." : "Pick-up"}
          </button>
        )}
      </div>
    </li>
  );
}
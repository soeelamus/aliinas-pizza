import { PickupCountdown } from "./PickupCountdown";

export default function Order({ order, onStatusChange, updatingId, currentTime }) {
  // ✅ PickupCountdown met fallback
  const countdown = PickupCountdown(order.pickuptime) || {
    hours: 0,
    minutes: 0,
    seconds: 0,
    pickupTimeFormatted: order.pickuptime || "Onbekend",
    isRed: order.pickuptime === "ASAP",
    isOrange: false,
  };

  // ✅ Parse pizza items
  const pizzas = order.items
    ?.split(",")
    .map((item) => item.trim())
    .map((item) => {
      const match = item.match(/^(\d+)\s*x\s*(.+)$/i);
      return match ? { quantity: Number(match[1]), name: match[2].trim() } : null;
    })
    .filter(Boolean) || [];

  const handleClick = (newStatus) => onStatusChange(order.id, newStatus);

  return (
    <li
      className={`kitchen-order
        ${order.status === "done" ? "done" : ""}
        ${order.status === "pickedup" ? "pickedup" : ""}
        ${countdown.isRed && order.status === "new" ? "urgent-red" : ""}
        ${countdown.isOrange && order.status === "new" ? "urgent-orange" : ""}
      `}
    >
      {/* Heading */}
      <div className="heading-box">
        <ul className="heading">
          <li>Naam: {order.customername?.toUpperCase() || "Onbekend"}</li>
          <li>
            Pickup:{" "}
            <strong className={order.pickuptime === "ASAP" ? "urgent-red" : ""}>
              {countdown.pickupTimeFormatted}
            </strong>
          </li>
          {order.status !== "pickedup" && (
            <li>
              {order.pickuptime === "ASAP"
                ? ""
                : `${countdown.hours.toString().padStart(2, "0")}:${countdown.minutes
                    .toString()
                    .padStart(2, "0")}:${countdown.seconds.toString().padStart(2, "0")}`}
            </li>
          )}
        </ul>
      </div>

      {/* Pizza items */}
      {pizzas.map((pizza, i) => (
        <div className="pizzas" key={i}>
          <div className="pizzas list">
            <div className="pizza-item">
              <input type="checkbox" id={`pizza-${i}`} />
              <span className="pizza-name">{pizza.name}</span>
            </div>
          </div>
          <div className="pizza-qty">{pizza.quantity}x</div>
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
          onClick={() => handleClick("done")}
          disabled={updatingId === order.id}
        >
          {updatingId === order.id ? "Updating..." : "Done"}
        </button>
      )}

      {order.status === "done" && (
        <button
          className="btn-purple"
          onClick={() => handleClick("pickedup")}
          disabled={updatingId === order.id}
        >
          {updatingId === order.id ? "Updating..." : "Pick-up"}
        </button>
      )}
    </li>
  );
}

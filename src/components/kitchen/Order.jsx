import { PickupCountdown } from "./PickupCountdown";

export default function Order({ order, onStatusChange, updatingId, currentTime }) {
  const countdown = PickupCountdown(order.pickuptime, currentTime);

  const pizzas = order.items
    .split(",")
    .map((item) => item.trim())
    .map((item) => {
      const match = item.match(/^(\d+)\s*x\s*(.+)$/i);
      return match ? { quantity: Number(match[1]), name: match[2].trim() } : null;
    })
    .filter(Boolean);

  const handleClick = (newStatus) => {
    onStatusChange(order.id, newStatus);
  };
  
  return (
    <li
      className={`kitchen-order
        ${order.status === "done" ? "done" : ""}
        ${order.status === "pickedup" ? "pickedup" : ""}
        ${countdown?.isRed && order.status === "new" ? "urgent-red" : ""}
        ${countdown?.isOrange && order.status === "new" ? "urgent-orange" : ""}
      `}
    >
      <ul className="heading">
        <div className="heading-box">
          <li>Naam: {order.customername?.toUpperCase() || "Onbekend"}</li>
          <li>Pickup: {countdown?.pickupTimeFormatted || "Onbekend"}</li>
        </div>
        {order.status !== "pickedup" && (
          <li>
            {countdown?.hours.toString().padStart(2, "0")}:
            {countdown?.minutes.toString().padStart(2, "0")}:
            {countdown?.seconds.toString().padStart(2, "0")}
          </li>
        )}
      </ul>

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

      {order.customernotes && <span className="pizzas list">Notes: {order.customernotes}</span>}

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

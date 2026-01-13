import { getPickupCountdown } from "./getPickupCountdown";

export default function Order({ order, onStatusChange, updatingId }) {
  function parseItems(itemsString) {
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
  const pizzas = parseItems(order.items);
  const countdown = getPickupCountdown(order.pickuptime);

  return (
    <li className={`kitchen-order ${order.status === "done" ? "done" : ""}`}>
      <ul className="heading">
        <div className="heading-box">
          <li>Naam: {order.customername || "Onbekend"}</li>
          <li>Pickup: {countdown?.pickupTimeFormatted || "Onbekend"}</li>
        </div>
        <li>
          {countdown?.hours}h {countdown?.minutes}m {countdown?.seconds}s
        </li>
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

      {order.customernotes && (
        <span className="pizzas list">Notes: {order.customernotes}</span>
      )}

      {order.status !== "done" && (
        <button
          className="btn-purple"
          onClick={() => onStatusChange(order.id)}
          disabled={updatingId === order.id}
        >
          {updatingId === order.id ? "Updating..." : "Done"}
        </button>
      )}
    </li>
  );
}

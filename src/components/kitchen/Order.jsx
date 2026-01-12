export default function Order({ order, onStatusChange }) {
    
  return (
    <li className={`kitchen-order ${order.status === "done" ? "done" : ""}`}>
      <h2>{order.customer}</h2>
      <p><strong>Order ID:</strong> {order.id}</p>
      <p><strong>Type:</strong> {order.type}</p>
      <p><strong>Notes:</strong> {order.notes || "—"}</p>
      <p><strong>Status:</strong> {order.status}</p>

      {order.status !== "done" && (
        <button onClick={() => onStatusChange(order.id, "done")}>
          Mark as Done
        </button>
      )}
    </li>
  );
}

import { useEffect, useState } from "react";
import Order from "./Order";
import "./../../assets/css/kitchen.css";

export default function KitchenScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        console.log(data);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (id, newStatus = "done") => {
    try {
      setUpdatingId(id);

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          String(order.id) === String(id)
            ? { ...order, status: newStatus }
            : order
        )
      );

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(id), status: newStatus }),
      });

      const data = await res.json();
      if (data.status !== "ok") {
        console.error("Status update failed:", data);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            String(order.id) === String(id)
              ? { ...order, status: order.status }
              : order
          )
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <section className="kitchen-section">
      <h1>🍳 Orders</h1>
      <ul className="kitchen-orders">
        {orders.map((order) => (
          <Order
            key={order.id}
            order={order}
            updatingId={updatingId}
            onStatusChange={handleStatusChange}
          />
        ))}
      </ul>
    </section>
  );
}

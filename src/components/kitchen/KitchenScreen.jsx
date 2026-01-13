import { useEffect, useState } from "react";
import Order from "./Order";
import "./../../assets/css/kitchen.css";

export default function KitchenScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // --- Helper: get pickup date today from HH:MM string ---
  const getPickupDate = (order) => {
    if (!order.pickuptime) return null;

    const match = order.pickuptime.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    const now = new Date();

    // Today with pickup time
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );
  };
// --- Helper: seconds until pickup, clamp at 0 ---
const getRemainingSeconds = (order) => {
  const pickup = getPickupDate(order);
  if (!pickup) return Infinity;

  const diffSec = (pickup - new Date()) / 1000;

  // Stop countdown at 0
  return Math.max(diffSec, 0);
};

  // --- Fetch orders every 5 seconds ---
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();

        const now = new Date();

        const filtered = data.filter((o) => {
  const pickup = getPickupDate(o);
  const ordered = new Date(o.orderedtime);

  if (!pickup || isNaN(ordered)) return false;

  // Only filter orders that are too far in the future
  const diffHours = (pickup - now) / 1000 / 3600;
  if (diffHours > 10) return false; // future too far

  // Ordered today
  const isToday =
    ordered.getFullYear() === now.getFullYear() &&
    ordered.getMonth() === now.getMonth() &&
    ordered.getDate() === now.getDate();

  return isToday;
});


        setOrders(filtered);
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

  // --- Handle status change ---
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

  const activeOrders = orders
    .filter((o) => o.status !== "pickedup")
    .sort((a, b) => {
      return getRemainingSeconds(a) - getRemainingSeconds(b);
    });
  const pickedUpOrders = orders.filter((o) => o.status === "pickedup");

  if (loading) return <p>Loading orders...</p>;

  return (
    <section className="kitchen-section">
      <h1>🍳 Orders</h1>

      <ul className="kitchen-orders">
        {activeOrders.map((order) => (
          <Order
            key={order.id}
            order={order}
            updatingId={updatingId}
            onStatusChange={handleStatusChange}
          />
        ))}
      </ul>

      {pickedUpOrders.length > 0 && (
        <>
          <h2>✅ Picked-up Orders</h2>
          <ul className="pickedup">
            {pickedUpOrders.map((order) => (
              <Order
                key={order.id}
                order={order}
                updatingId={updatingId}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

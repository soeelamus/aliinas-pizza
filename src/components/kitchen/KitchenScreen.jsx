import { useEffect, useState, useRef } from "react";
import Order from "./Order";
import "./../../assets/css/kitchen.css";
import StockForm from "./StockForm";

export default function KitchenScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingUpdates, setPendingUpdates] = useState({}); // track optimistic updates

  const alertAudio = useRef(new Audio("/sound/sound-effect.mp3"));
  const prevOrders = useRef([]);
  const firstFetch = useRef(true);

  // --- Helper: get pickup date today from HH:MM string ---
  const getPickupDate = (order) => {
    if (!order.pickuptime) return null;

    const match = order.pickuptime.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  };

  // --- Helper: seconds until pickup, stop at 0 ---
  const getRemainingSeconds = (order) => {
    const pickup = getPickupDate(order);
    if (!pickup) return Infinity;
    const diffSec = (pickup - currentTime) / 1000;
    return Math.max(diffSec, 0);
  };

  // --- Update currentTime every second for countdowns ---
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

          const diffHours = (pickup - now) / 1000 / 3600;
          if (diffHours > 10) return false;

          const isToday =
            ordered.getFullYear() === now.getFullYear() &&
            ordered.getMonth() === now.getMonth() &&
            ordered.getDate() === now.getDate();

          return isToday;
        });

        // Merge pending updates so orders don't flap
        const merged = filtered.map((order) =>
          pendingUpdates[order.id]
            ? { ...order, status: pendingUpdates[order.id] }
            : order
        );

        // Only play sound for new orders
        if (audioAllowed && !firstFetch.current) {
          const prevIds = new Set(prevOrders.current.map((o) => o.id));
          const newOrders = merged.filter((o) => !prevIds.has(o.id));
          if (newOrders.length > 0) {
            alertAudio.current.play().catch(() => {});
          }
        }

        prevOrders.current = merged;
        firstFetch.current = false;
        setOrders(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
    const interval = setInterval(fetchOrders, 2500);
    return () => clearInterval(interval);
  }, [audioAllowed, pendingUpdates]);

  // --- Handle status change with optimistic update ---
  const handleStatusChange = async (id, newStatus = "done") => {
    try {
      setUpdatingId(id);
      // mark as pending
      setPendingUpdates((prev) => ({ ...prev, [id]: newStatus }));

      // optimistic update in UI
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          String(order.id) === String(id) ? { ...order, status: newStatus } : order
        )
      );

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(id), status: newStatus }),
      });

      const data = await res.json();
      if (data.status === "ok") {
        // remove from pending
        setPendingUpdates((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      } else {
        throw new Error("Status update failed");
      }
    } catch (err) {
      console.error(err);
      // revert change if failed
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          String(order.id) === String(id) ? { ...order, status: order.status } : order
        )
      );
      setPendingUpdates((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Separate active and picked-up orders ---
  const activeOrders = orders
    .filter((o) => o.status !== "pickedup")
    .sort((a, b) => getRemainingSeconds(a) - getRemainingSeconds(b));
  const pickedUpOrders = orders.filter((o) => o.status === "pickedup");

  if (!audioAllowed) {
    return (
      <div className="center form">
        <StockForm />
        <button className="btn-purple btn-margin" onClick={() => setAudioAllowed(true)}>
          Start Kitchen
        </button>
      </div>
    );
  }

  if (loading) return <p>Loading orders...</p>;

  return (
    <section className="kitchen-section">
      <h1 className="monoton-regular white">Orders</h1>
      {activeOrders.length > 0 ? (
        <ul className="kitchen-orders">
          {activeOrders.map((order) => (
            <Order
              key={order.id}
              order={order}
              currentTime={currentTime}
              updatingId={updatingId}
              onStatusChange={handleStatusChange}
            />
          ))}
        </ul>
      ) : (
        <div className="center margin">
          <p className="loader"></p>
          <p>Waiting for new orders</p>
        </div>
      )}

      {pickedUpOrders.length > 0 && (
        <>
          <div className="center">
            <h2 className="monoton-regular white">✅ Picked-up</h2>
          </div>
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

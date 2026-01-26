import { useEffect, useState, useRef } from "react";
import Order from "./Order";
import "./../../assets/css/kitchen.css";
import StockForm from "./StockForm";
import { useCart } from "../../contexts/CartContext";

export default function KitchenScreen({ onStartKitchen }) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="center form">
        <StockForm />
        <button
          className="btn-purple btn-margin"
          onClick={() => {
            setStarted(true);
            if (onStartKitchen) onStartKitchen();
          }}
        >
          Start Kitchen
        </button>
      </div>
    );
  }


  return <KitchenActive />;
}

/* -------- KitchenActive: pas mount na start -------- */
function KitchenActive() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [audioAllowed] = useState(true); // al gestart
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingUpdates, setPendingUpdates] = useState({});
  const alertAudio = useRef(new Audio("/sound/sound-effect.mp3"));
  const prevOrders = useRef([]);
  const firstFetch = useRef(true);
  const intervalRef = useRef(null);
  const { refreshStock } = useCart();

  useEffect(() => {
    refreshStock();
  }, []);

  const getPickupDate = (order) => {
    if (!order.pickuptime) return null;
    if (order.pickuptime === "ASAP") return new Date();
    const [hours, minutes] = order.pickuptime.split(":").map(Number);
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );
  };

  const getRemainingSeconds = (order) => {
    const pickup = getPickupDate(order);
    if (!pickup) return Infinity;
    return Math.max((pickup - currentTime) / 1000, 0);
  };

  /* ---------------- Clock ---------------- */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------- Fetch orders ---------------- */
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
          if (o.pickuptime !== "ASAP" && diffHours > 10) return false;
          const isToday =
            ordered.getFullYear() === now.getFullYear() &&
            ordered.getMonth() === now.getMonth() &&
            ordered.getDate() === now.getDate();
          return isToday;
        });

        const merged = filtered.map((order) =>
          pendingUpdates[order.id]
            ? { ...order, status: pendingUpdates[order.id] }
            : order
        );

        // Alleen nieuwe orders geluid
        if (!firstFetch.current) {
          const prevIds = new Set(prevOrders.current.map((o) => o.id));
          const newOrders = merged.filter((o) => !prevIds.has(o.id));
          if (audioAllowed && newOrders.length > 0) {
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
    intervalRef.current = setInterval(fetchOrders, 2500);
    return () => clearInterval(intervalRef.current);
  }, [pendingUpdates, audioAllowed]);

  /* ---------------- Handle status ---------------- */
  const handleStatusChange = async (id, newStatus = "done") => {
    try {
      setUpdatingId(id);
      setPendingUpdates((prev) => ({ ...prev, [id]: newStatus }));
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(id) ? { ...o, status: newStatus } : o
        )
      );

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(id), status: newStatus }),
      });

      const data = await res.json();
      if (data.status === "ok") {
        setPendingUpdates((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    } catch (err) {
      console.error(err);
      setPendingUpdates((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------------- Separate orders ---------------- */
  const activeOrders = orders
    .filter((o) => o.status !== "pickedup")
    .sort((a, b) => {
      if (a.pickuptime === "ASAP") return -1;
      if (b.pickuptime === "ASAP") return 1;
      return getRemainingSeconds(a) - getRemainingSeconds(b);
    });

  const pickedUpOrders = orders.filter((o) => o.status === "pickedup");

  /* ---------------- UI ---------------- */
  if (loading)
    return (
      <div className="center margin">
        <p className="loader"></p>
        <p>Loading orders...</p>
      </div>
    );

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

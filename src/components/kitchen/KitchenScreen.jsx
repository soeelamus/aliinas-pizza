import { useEffect, useState, useRef } from "react";
import Order from "./Order";
import "./../../assets/css/kitchen.css";
import StockForm from "./StockForm";
import { useCart } from "../../contexts/CartContext";
import Loading from "../Loading/Loading";

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

/* ---------------- KitchenActive ---------------- */
function KitchenActive() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingUpdates, setPendingUpdates] = useState({});
  const alertAudio = useRef(null);
  const prevOrders = useRef([]);
  const firstFetch = useRef(true);
  const intervalRef = useRef(null);
  const { refreshStock } = useCart();
  const audioAllowed = useRef(true);

  useEffect(() => {
    const audio = new Audio("/sound/sound-effect.mp3");
    audio.preload = "auto";
    alertAudio.current = audio;

    return () => {
      // cleanup: stop en release
      audio.pause();
      audio.src = "";
      alertAudio.current = null;
    };
  }, []);
  /* ---------------- Refresh stock on mount ---------------- */
  useEffect(() => {
    refreshStock();
  }, [refreshStock]);

  /* ---------------- Clock ---------------- */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------- Helper: get Date object from pickupTime ---------------- */
  const getPickupDate = (order) => {
    const pickup = order.pickuptime;
    if (!pickup) return null;

    // ASAP → nu
    if (pickup === "ASAP") return new Date();

    // Als pickup al een Date-string is
    const date = new Date(pickup);
    if (!isNaN(date.getTime())) return date;

    // HH:MM format
    const match = pickup.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const [, h, m] = match;
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        Number(h),
        Number(m),
        0,
      );
    }

    return null;
  };

  const getRemainingSeconds = (order) => {
    const pickup = getPickupDate(order);
    if (!pickup) return Infinity;
    return Math.max((pickup - currentTime) / 1000, 0);
  };

  /* ---------------- Fetch orders ---------------- */
  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();

        if (!isMounted) return;

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

        // Merge pending updates
        const merged = filtered.map((order) =>
          pendingUpdates[order.id]
            ? { ...order, status: pendingUpdates[order.id] }
            : order,
        );

        // Play sound for new orders
        if (!firstFetch.current) {
          const prevIds = new Set(prevOrders.current.map((o) => o.id));
          const newOrders = merged.filter((o) => !prevIds.has(o.id));

          if (
            audioAllowed.current &&
            newOrders.length > 0 &&
            alertAudio.current
          ) {
            const a = alertAudio.current;
            a.currentTime = 0;
            a.play().catch(() => {});
          }
        }

        prevOrders.current = merged;
        firstFetch.current = false;
        setOrders(merged);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, 2500);

    return () => {
      isMounted = false;
      clearInterval(intervalRef.current);
    };
  }, [pendingUpdates]); // ✅ dependency op pendingUpdates, niet orders → voorkomt infinite loop

  /* ---------------- Handle status change ---------------- */
  const handleStatusChange = async (id, newStatus = "done") => {
    try {
      setUpdatingId(id);
      setPendingUpdates((prev) => ({ ...prev, [id]: newStatus }));
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(id) ? { ...o, status: newStatus } : o,
        ),
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

  /* ---------------- Separate & Sort orders ---------------- */
  const activeOrders = orders
    .filter((o) => o.status !== "pickedup")
    .sort((a, b) => {
      const aPickup = getPickupDate(a);
      const bPickup = getPickupDate(b);

      if (!aPickup) return 1;
      if (!bPickup) return -1;

      if (a.pickuptime === "ASAP") return -1;
      if (b.pickuptime === "ASAP") return 1;

      return aPickup - bPickup;
    });

  const pickedUpOrders = orders.filter((o) => o.status === "pickedup");

  /* ---------------- UI ---------------- */
  if (loading) return <Loading innerHTML={"Waiting for new orders"} />;

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
        <Loading innerHTML={"Waiting for new orders"} />
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

import { useEffect, useState, useRef, useCallback } from "react";
import Order from "./Order";
import "./../../assets/css/kitchen.css";
import "./../../assets/css/checkout.css";
import StockForm from "./StockForm";
import ConnectTerminalButton from "./ConnectTerminalButton";
import Loading from "../Loading/Loading";

export default function KitchenScreen({ onStartKitchen }) {
  const [started, setStarted] = useState(false);

  const handleStart = useCallback(() => {
    setStarted(true);
    onStartKitchen?.();
  }, [onStartKitchen]);

  const handleBackToSetup = useCallback(() => {
    setStarted(false);
  }, []);

  if (!started) {
    return (
      <div className="checkout-popup-overlay">
        <div className="checkout-popup form-popup">
          <StockForm />

          <div className="kitchen-section form">
            <p>Verbind de terminal</p>
            <ConnectTerminalButton />
            <p>Daarna kan je de keuken starten.</p>

            <button className="btn-purple btn-margin" onClick={handleStart}>
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <KitchenActive onBackToSetup={handleBackToSetup} />;
}

/* ---------------- KitchenActive ---------------- */
function KitchenActive({ onBackToSetup }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingUpdates, setPendingUpdates] = useState({});
  const alertAudio = useRef(null);
  const prevOrders = useRef([]);
  const firstFetch = useRef(true);

  const intervalRef = useRef(null);
  const audioAllowed = useRef(true);

  // ✅ nieuw: version tracking
  const lastOrdersVersion = useRef(null);

  useEffect(() => {
    const audio = new Audio("/sound/sound-effect.mp3");
    audio.preload = "auto";
    alertAudio.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      alertAudio.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPickupDate = (order) => {
    const pickup = order.pickuptime;
    if (!pickup) return null;

    if (pickup === "ASAP") return new Date();

    const date = new Date(pickup);
    if (!isNaN(date.getTime())) return date;

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

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
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

        const merged = filtered.map((order) =>
          pendingUpdates[order.id]
            ? { ...order, status: pendingUpdates[order.id] }
            : order,
        );
        
        if (!firstFetch.current) {
          const prevIds = new Set(prevOrders.current.map((o) => o.id));
          const newOrders = merged
            .filter((o) => !prevIds.has(o.id))
            // ❌ geen geluid voor terminal orders
            .filter(
              (o) =>
                String(o.customername ?? "")
                  .trim()
                  .toLowerCase() !== "cashier",
            );

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

        console.log("🍳 Orders fetched:", merged.length);
      } catch (err) {
        console.error("🍳 fetchOrders error:", err);
      }
    };

    const checkVersionAndFetch = async () => {
      try {
        const vRes = await fetch("/api/orders-version", { cache: "no-store" });
        const vJson = await vRes.json();
        const version = String(vJson?.version ?? "");

        if (version && version === lastOrdersVersion.current) {
          console.log(
            "🍳 Orders unchanged → skip fetch (version:",
            version,
            ")",
          );
          return;
        }

        console.log(
          "🍳 Orders changed",
          lastOrdersVersion.current,
          "→",
          version,
        );
        lastOrdersVersion.current = version;

        await fetchOrders();
      } catch (e) {
        console.warn("🍳 orders-version failed → fallback to full fetch:", e);
        await fetchOrders();
      }
    };

    const stop = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };

    const start = () => {
      stop(); // ✅ belangrijk: voorkomt dubbele intervals
      checkVersionAndFetch(); // meteen 1x
      intervalRef.current = setInterval(checkVersionAndFetch, 20000);
    };

    const onVis = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    document.addEventListener("visibilitychange", onVis);
    onVis(); // init

    return () => {
      isMounted = false;
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pendingUpdates]);

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

  if (loading) {
    return (
      <section className="kitchen-section">
        <button
          className="btn-settings btn-purple btn-small fa fa-gear"
          onClick={onBackToSetup}
        >
          
        </button>
        <Loading innerHTML={"Waiting for new orders"} />
      </section>
    );
  }

  return (
    <section className="kitchen-section">
      <button
        className="btn-settings btn-purple btn-small fa fa-gear"
        onClick={onBackToSetup}
      >
        
      </button>

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
              getRemainingSeconds={getRemainingSeconds}
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

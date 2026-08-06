import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Order from "./Order";
import StockForm from "./StockForm";
import ConnectTerminalButton from "./ConnectTerminalButton";
import Loading from "../Loading/Loading";

import "./../../assets/css/kitchen.css";
import "./../../assets/css/checkout.css";

const POLLING_INTERVAL = 20_000;

function getKitchenHeaders() {
  return {
    "x-kitchen-token":
      localStorage.getItem("kitchenAuth"),
  };
}

function getPickupDate(order) {
  const pickup = order.pickuptime;

  if (!pickup) return null;

  if (pickup === "ASAP") {
    return new Date();
  }

  const parsedDate = new Date(pickup);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  const match = pickup.match(
    /(\d{1,2}):(\d{2})/,
  );

  if (match) {
    const [, hours, minutes] = match;
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Number(hours),
      Number(minutes),
      0,
    );
  }

  return null;
}

export default function KitchenScreen({
  onStartKitchen,
}) {
  const [started, setStarted] =
    useState(false);

  const handleStart = useCallback(() => {
    setStarted(true);
    onStartKitchen?.();
  }, [onStartKitchen]);

  const handleBackToSetup =
    useCallback(() => {
      setStarted(false);
    }, []);

  if (!started) {
    return (
      <div className="checkout-popup-overlay">
        <div className="checkout-popup form-popup">
          <div className="kitchen-section form">
            <button
              className="btn-purple btn-margin"
              onClick={handleStart}
            >
              Start
            </button>

            <ConnectTerminalButton />

            <StockForm />

            <button
              className="btn-purple btn-margin"
              onClick={handleStart}
            >
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <KitchenActive
      onBackToSetup={handleBackToSetup}
    />
  );
}

function KitchenActive({
  onBackToSetup,
}) {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const [pendingUpdates, setPendingUpdates] =
    useState({});

  const alertAudio = useRef(null);
  const prevOrders = useRef([]);
  const firstFetch = useRef(true);

  const intervalRef = useRef(null);
  const fetchInProgress = useRef(false);
  const audioAllowed = useRef(true);

  const mockOrderRef = useRef({
    id: "mock-1",
    customername: "DEBUG ORDER",
    pickuptime: "ASAP",
    items:
      "1 x Margherita, 2 x Pepperoni",
    customernotes:
      "Mock order (server offline)",
    status: "new",
    orderedtime:
      new Date().toISOString(),
  });

  useEffect(() => {
    const audio = new Audio(
      "/sound/sound-effect.mp3",
    );

    audio.preload = "auto";
    alertAudio.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      alertAudio.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const getRemainingSeconds = useCallback(
    (order) => {
      const pickup = getPickupDate(order);

      if (!pickup) {
        return Infinity;
      }

      return Math.max(
        (pickup - currentTime) / 1000,
        0,
      );
    },
    [currentTime],
  );

  useEffect(() => {
    let isMounted = true;

    const useMockOrder = (reason) => {
      if (!isMounted) return;

      console.warn(
        "⚠️ Using MOCK order:",
        reason,
      );

      mockOrderRef.current = {
        ...mockOrderRef.current,
        orderedtime:
          new Date().toISOString(),
        status:
          mockOrderRef.current.status ||
          "new",
      };

      setOrders([
        mockOrderRef.current,
      ]);

      setLoading(false);
    };

    const fetchOrders = async () => {
      if (fetchInProgress.current) {
        return;
      }

      fetchInProgress.current = true;

      try {
        const response = await fetch(
          "/api/orders",
          {
            cache: "no-store",
            headers:
              getKitchenHeaders(),
          },
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`,
          );
        }

        const data =
          await response.json();

        if (!isMounted) return;

        const merged = data.map(
          (order) => {
            const pendingStatus =
              pendingUpdates[
                order.id
              ];

            if (!pendingStatus) {
              return order;
            }

            return {
              ...order,
              status: pendingStatus,
            };
          },
        );

        if (!firstFetch.current) {
          const previousIds =
            new Set(
              prevOrders.current.map(
                (order) => order.id,
              ),
            );

          const newOrders =
            merged
              .filter(
                (order) =>
                  !previousIds.has(
                    order.id,
                  ),
              )
              .filter(
                (order) =>
                  String(
                    order.customername ??
                      "",
                  )
                    .trim()
                    .toLowerCase() !==
                  "cashier",
              );

          if (
            audioAllowed.current &&
            newOrders.length > 0 &&
            alertAudio.current
          ) {
            const audio =
              alertAudio.current;

            audio.currentTime = 0;

            audio
              .play()
              .catch(() => {});
          }
        }

        prevOrders.current =
          merged;

        firstFetch.current =
          false;

        setOrders(merged);
        setLoading(false);

        console.log(
          "🍳 Orders fetched:",
          merged.length,
        );
      } catch (error) {
        console.error(
          "🍳 fetchOrders error:",
          error,
        );

        useMockOrder(
          error?.message || error,
        );
      } finally {
        fetchInProgress.current =
          false;
      }
    };

    const stopPolling = () => {
      if (
        intervalRef.current
      ) {
        window.clearInterval(
          intervalRef.current,
        );

        intervalRef.current =
          null;
      }
    };

    const startPolling = () => {
      stopPolling();

      fetchOrders();

      intervalRef.current =
        window.setInterval(
          fetchOrders,
          POLLING_INTERVAL,
        );
    };

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          startPolling();
        } else {
          stopPolling();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    handleVisibilityChange();

    return () => {
      isMounted = false;

      stopPolling();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [pendingUpdates]);

  const handleOrderDetailsChange =
    async (id, updates) => {
      if (
        String(id) === "mock-1"
      ) {
        mockOrderRef.current = {
          ...mockOrderRef.current,
          ...updates,
        };

        setOrders((current) =>
          current.map((order) =>
            String(order.id) ===
            String(id)
              ? {
                  ...order,
                  ...updates,
                }
              : order,
          ),
        );

        return;
      }

      try {
        setUpdatingId(id);

        setOrders((current) =>
          current.map((order) =>
            String(order.id) ===
            String(id)
              ? {
                  ...order,
                  ...updates,
                }
              : order,
          ),
        );

        const response =
          await fetch(
            "/api/orders",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                ...getKitchenHeaders(),
              },
              body: JSON.stringify({
                action:
                  "updateOrder",
                id: String(id),
                ...updates,
              }),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          data.status !== "ok"
        ) {
          throw new Error(
            data.error ||
              "Update failed",
          );
        }
      } catch (error) {
        console.error(error);

        alert(
          "Order aanpassen mislukt",
        );
      } finally {
        setUpdatingId(null);
      }
    };

  const handleStatusChange =
    async (
      id,
      newStatus = "done",
    ) => {
      if (
        String(id) === "mock-1"
      ) {
        mockOrderRef.current = {
          ...mockOrderRef.current,
          status: newStatus,
        };

        setOrders((current) =>
          current.map((order) =>
            String(order.id) ===
            String(id)
              ? {
                  ...order,
                  status: newStatus,
                }
              : order,
          ),
        );

        return;
      }

      try {
        setUpdatingId(id);

        setPendingUpdates(
          (current) => ({
            ...current,
            [id]: newStatus,
          }),
        );

        setOrders((current) =>
          current.map((order) =>
            String(order.id) ===
            String(id)
              ? {
                  ...order,
                  status: newStatus,
                }
              : order,
          ),
        );

        const response =
          await fetch(
            "/api/orders",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                ...getKitchenHeaders(),
              },
              body: JSON.stringify({
                action:
                  "updateStatus",
                id: String(id),
                status: newStatus,
              }),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          data.status !== "ok"
        ) {
          throw new Error(
            data.error ||
              "Status aanpassen mislukt",
          );
        }

        setPendingUpdates(
          (current) => {
            const next = {
              ...current,
            };

            delete next[id];

            return next;
          },
        );
      } catch (error) {
        console.error(error);

        setPendingUpdates(
          (current) => {
            const next = {
              ...current,
            };

            delete next[id];

            return next;
          },
        );
      } finally {
        setUpdatingId(null);
      }
    };

  const activeOrders = orders
    .filter(
      (order) =>
        order.status !==
        "pickedup",
    )
    .sort((a, b) => {
      const aPickup =
        getPickupDate(a);

      const bPickup =
        getPickupDate(b);

      if (!aPickup) return 1;
      if (!bPickup) return -1;

      if (
        a.pickuptime === "ASAP"
      ) {
        return -1;
      }

      if (
        b.pickuptime === "ASAP"
      ) {
        return 1;
      }

      return aPickup - bPickup;
    });

  const pickedUpOrders =
    orders.filter(
      (order) =>
        order.status ===
        "pickedup",
    );

  if (loading) {
    return (
      <section className="kitchen-section">
        <button
          className="btn-settings btn-purple btn-small"
          onClick={
            onBackToSetup
          }
        >
          ⚙
        </button>

        <Loading
          innerHTML={
            "Loading orders"
          }
        />
      </section>
    );
  }

  return (
    <section className="kitchen-section">
      <button
        className="btn-settings btn-purple btn-small"
        onClick={
          onBackToSetup
        }
      >
        ⚙
      </button>

      <h1 className="monoton-regular white">
        Orders
      </h1>

      {activeOrders.length > 0 ? (
        <ul className="kitchen-orders">
          {activeOrders.map(
            (order) => (
              <Order
                key={order.id}
                order={order}
                currentTime={
                  currentTime
                }
                updatingId={
                  updatingId
                }
                onStatusChange={
                  handleStatusChange
                }
                onOrderDetailsChange={
                  handleOrderDetailsChange
                }
                getRemainingSeconds={
                  getRemainingSeconds
                }
              />
            ),
          )}
        </ul>
      ) : (
        <Loading
          innerHTML={
            "Waiting for new orders"
          }
        />
      )}

      {pickedUpOrders.length >
        0 && (
        <>
          <div className="center">
            <h2 className="monoton-regular white margin-5">
              ✅ picked-up
            </h2>
          </div>

          <ul className="pickedup">
            {pickedUpOrders.map(
              (order) => (
                <Order
                  key={order.id}
                  order={order}
                  updatingId={
                    updatingId
                  }
                  onStatusChange={
                    handleStatusChange
                  }
                />
              ),
            )}
          </ul>
        </>
      )}
    </section>
  );
}
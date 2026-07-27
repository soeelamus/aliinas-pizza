import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useEvents } from "../contexts/EventsContext";

const KitchenLayout = () => {
  const { refreshStock } = useCart();
  const { setForcedIsOpen } = useEvents();
  const intervalRef = useRef(null);

  useEffect(() => {
    setForcedIsOpen(true);

    return () => {
      setForcedIsOpen(false);
    };
  }, [setForcedIsOpen]);

  useEffect(() => {
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = null;
    };

    const start = () => {
      stop();

      refreshStock();

      intervalRef.current = setInterval(() => {
        refreshStock();
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    handleVisibilityChange();

    return () => {
      stop();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [refreshStock]);

  return <Outlet />;
};

export default KitchenLayout;
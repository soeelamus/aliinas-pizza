import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

const KitchenLayout = () => {
  const { refreshStock } = useCart();
  const intervalRef = useRef(null);

  useEffect(() => {
    const start = () => {
      stop();
      refreshStock();
      intervalRef.current = setInterval(refreshStock, 20000);
    };

    const stop = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };

    const onVis = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    document.addEventListener("visibilitychange", onVis);
    onVis();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshStock]);

  return <Outlet />;
};

export default KitchenLayout;

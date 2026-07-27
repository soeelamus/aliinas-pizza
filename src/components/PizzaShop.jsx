import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Cart from "./Cart";
import Menu from "./Menu";
import OpenState from "./OpenState";
import { useEvents } from "../contexts/EventsContext";
import { useCart } from "../contexts/CartContext";
import Wave from "./Wave";
import Loading from "./Loading/Loading";

const PizzaShop = () => {
  const location = useLocation();

  const isOrderingRoute =
    location.pathname === "/" || location.pathname === "/ordering";

  const [stockLoading, setStockLoading] = useState(false);
  const [stockLoaded, setStockLoaded] = useState(false);

  const { events, isOpen, loading } = useEvents();
  const { stockSheetState, refreshStock } = useCart();

  // Stock laden indien nodig
  const ensureStockLoaded = useCallback(async () => {
    if (stockLoaded && stockSheetState.length) return;

    setStockLoading(true);

    try {
      await refreshStock();
      setStockLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setStockLoading(false);
    }
  }, [refreshStock, stockLoaded, stockSheetState.length]);

  useEffect(() => {
    if (isOrderingRoute) {
      ensureStockLoaded();
    }
  }, [isOrderingRoute, ensureStockLoaded]);

  const isLoading =
    loading ||
    (isOrderingRoute && stockLoading && stockSheetState.length === 0);

  return (
    <>
      <Wave reverse />

      <div id="menu" className="style2 main">
        {/* <AdBox /> */}

        <OpenState isOpen={isOpen} events={events} />

        {isLoading && (
          <Loading white="white" innerHTML="Bestelfunctie wordt geladen" />
        )}
        {!isLoading && <Cart isOpen={isOpen} />}
        <Menu stockSheet={stockSheetState} events={events} isOpen={isOpen} />
      </div>

      <Wave />
    </>
  );
};

export default PizzaShop;

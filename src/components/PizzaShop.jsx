import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Cart from "./Cart";
import Menu from "./Menu";
import AdBox from "./AdBox";
import OpenState from "./OpenState";
import { useEvents } from "../contexts/EventsContext";
import { useCart } from "../contexts/CartContext";
import Wave from "./Wave";
import Loading from "./Loading/Loading";

const PizzaShop = () => {
  const location = useLocation();
  const isOrderingRoute =
    location.pathname === "/" || location.pathname === "/ordering";

  const [pizzas, setPizzas] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockLoaded, setStockLoaded] = useState(false);

  const { events, isOpen, loading } = useEvents();
  const { stockSheetState, refreshStock } = useCart();

  // Fetch pizzas (lokaal json)
  useEffect(() => {
    fetch("/json/pizzas.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch(console.error);
  }, []);

  // ✅ On-demand stock loader
  const ensureStockLoaded = useCallback(async () => {
    if (stockLoaded && stockSheetState?.length) return;

    setStockLoading(true);
    try {
      await refreshStock();
      setStockLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setStockLoading(false);
    }
  }, [refreshStock, stockLoaded, stockSheetState?.length]);

  useEffect(() => {
    if (isOrderingRoute) {
      ensureStockLoaded();
    }
  }, [isOrderingRoute, ensureStockLoaded]);

  const isLoading =
    loading ||
    pizzas.length === 0 ||
    (isOrderingRoute && stockLoading && !stockSheetState?.length);

  console.log("Pizzashop is open:", isOpen);

  return (
    <>
      <Wave reverse={true} />
      <div id="menu" className="style2 main">
        <AdBox />
        <OpenState isOpen={isOpen} events={events} />
        {isLoading && <Loading white="white" innerHTML="Bestelfunctie wordt geladen" />}
        {!isLoading && <Cart isOpen={isOpen} />}
        <Menu
          pizzas={pizzas}
          stockSheet={stockSheetState}
          events={events}
          isOpen={isOpen}
        />
      </div>
      <Wave />
    </>
  );
};

export default PizzaShop;

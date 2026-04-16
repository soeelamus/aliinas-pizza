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
  const isOrderingRoute = location.pathname === "/ordering";

  const [pizzas, setPizzas] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockLoaded, setStockLoaded] = useState(false);

  const { events, isOpen, loading } = useEvents();
  const { stockSheetState, refreshStock } = useCart();

  // Fetch pizzas (lokaal json, ok om bij load te doen)
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

  // ✅ Op /ordering: stock meteen ophalen
  useEffect(() => {
    if (isOrderingRoute) {
      ensureStockLoaded();
    }
  }, [isOrderingRoute, ensureStockLoaded]);

  const isLoading =
    loading ||
    pizzas.length === 0 ||
    (isOrderingRoute && stockLoading && !stockSheetState?.length);

  if (isLoading) {
    return (
      <>
        <Loading innerHTML="Bestelfunctie wordt geladen" />
        <Menu
          pizzas={pizzas}
          stockSheet={stockSheetState}
          events={events}
          isOpen={isOpen}
        />
      </>
    );
  }

  console.log("Pizzashop is open:", isOpen);

  return (
    <>
      <Wave reverse={true} />
      <div className="style2 main">
        <OpenState isOpen={isOpen} events={events} onRoute={isOrderingRoute} />
        <br id="menu" />
        <Cart isOpen={isOpen} />
        {isOrderingRoute ? (
          <Menu
            pizzas={pizzas}
            stockSheet={stockSheetState}
            events={events}
            isOpen={isOpen}
          />
        ) : (
          <Menu pizzas={pizzas} events={events} isOpen={false} />
        )}
      </div>
      <Wave />
    </>
  );
};

export default PizzaShop;

import React, { useState, useEffect, useCallback } from "react";
import Cart from "./Cart";
import Menu from "./Menu";
import OpenState from "./OpenState";
import { useEvents } from "../contexts/EventsContext";
import { useCart } from "../contexts/CartContext";
import Wave from "./Wave";
import Loading from "./Loading/Loading";

const PizzaShop = () => {
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
    // al geladen? niks doen
    if (stockLoaded && stockSheetState?.length) return;

    setStockLoading(true);
    try {
      await refreshStock(); // ✅ gebruikt version check + full fetch indien nodig
      setStockLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setStockLoading(false);
    }
  }, [refreshStock, stockLoaded, stockSheetState?.length]);

  // Wacht tot basisdata (events + pizzas) geladen is
  if (loading || pizzas.length === 0) {
    return <Loading innerHTML={"Loading cashier"} />;
  }

  return (
    <>
      <Wave reverse={true} />
      <div className="style2 main special">
        <div className="menu"></div>
        <OpenState events={events} />

        <br id="menu" />

        {/* ✅ knop om stock te laden + naar menu te gaan */}
        {!stockSheetState?.length ? (
          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
            <button
              className="btn-purple"
              onClick={async () => {
                await ensureStockLoaded();
                // scroll naar menu na load
                document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
              }}
              disabled={stockLoading}
            >
              {stockLoading ? "Stock laden..." : "Bestel nu"}
            </button>
          </div>
        ) : null}

        {/* Cart kan blijven, maar als je wil kan je die ook pas tonen na stock */}
        <Cart isOpen={isOpen} />

        {/* Menu tonen pas als stock beschikbaar is */}
        {stockSheetState?.length ? (
          <Menu
            pizzas={pizzas}
            stockSheet={stockSheetState}
            events={events}
            isOpen={isOpen}
          />
        ) : (
          <Loading innerHTML={"Klik op 'Bestel nu' om het menu te laden"} />
        )}
      </div>
      <Wave />
    </>
  );
};

export default PizzaShop;

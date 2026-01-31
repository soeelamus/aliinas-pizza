// PizzaShop.jsx
import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import Menu from "./Menu";
import OrderDate from "./OrderDate";
import { useEvents } from "../contexts/EventsContext";
import { useCart } from "../contexts/CartContext";
import Wave from "./Wave";
import Loading from "./Loading/Loading";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const { events, isOpen, loading } = useEvents();
  const { stockSheetState, setStockSheetState } = useCart();

  // Fetch pizzas
  useEffect(() => {
    fetch("/json/pizzas.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch(console.error);
  }, []);

  // Fetch stockSheet en update globale context
  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => setStockSheetState(data))
      .catch(console.error);
  }, [setStockSheetState]);

  // Wacht tot alles geladen is
  if (loading || pizzas.length === 0) {
    return <Loading innerHTML={"Loading cashier"} />;
  }

  return (
    <>
      <Wave reverse={true} />
      <div className="style2 main special">
        <div className="menu"></div>
        <OrderDate events={events} />
        <br id="menu" />
        <Cart isOpen={isOpen} />
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

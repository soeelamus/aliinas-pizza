// KitchenCashier.jsx
import React, { useState, useEffect } from "react";
import Cart from "../Cart";
import Menu from "../Menu";
import { useCart } from "../../contexts/CartContext";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const { stockSheetState, setStockSheetState } = useCart();

  // Fetch pizzas
  useEffect(() => {
    fetch("/json/pizzas.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch(console.error);
  }, []);

  // Fetch stockSheet en update context
  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => setStockSheetState(data))
      .catch(console.error);
  }, [setStockSheetState]);

  // Wacht tot alles geladen is
  if (pizzas.length === 0 || stockSheetState.length === 0) {
    return (
      <div className="center margin">
        <p className="loader"></p>
        <p>Loading cashier</p>
      </div>
    );
  }

  return (
    <div className="pizza-shop">
      <Cart isOpen={true} />
      <Menu pizzas={pizzas} stockSheet={stockSheetState} isOpen={true} />
    </div>
  );
};

export default PizzaShop;

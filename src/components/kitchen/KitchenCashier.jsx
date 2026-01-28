// KitchenCashier.jsx
import React, { useState, useEffect } from "react";
import Cart from "../Cart";
import Menu from "../Menu";
import { useCart } from "../../contexts/CartContext";

const KitchenCashier = () => {
  const [pizzas, setPizzas] = useState([]);
  const { stockSheetState, setStockSheetState } = useCart();

  // Fetch pizzas
  useEffect(() => {
    fetch("/json/pizzas.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch(console.error);
  }, []);

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
      <Menu pizzas={pizzas} stockSheet={stockSheetState} isOpen={true} isKitchen={true}/>
    </div>
  );
};

export default KitchenCashier;

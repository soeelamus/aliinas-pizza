// PizzaShop.jsx
import React, { useState, useEffect } from "react";
import Cart from "../Cart";
import Menu from "../Menu";
import { CartProvider } from "../../contexts/CartContext";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const [stockSheet, setStockSheet] = useState([]);

  // Fetch pizzas
  useEffect(() => {
    fetch("/json/pizzas.json")
      .then(res => res.json())
      .then(data => setPizzas(data.Pizzas || []))
      .catch(console.error);
  }, []);

  // Fetch stockSheet
  useEffect(() => {
    fetch("/api/stock")
      .then(res => res.json())
      .then(setStockSheet)
      .catch(console.error);
  }, []);

  // Wacht tot alles geladen is
  if (pizzas.length === 0 || stockSheet.length === 0) {
    return <p>Laden…</p>;
  }

  return (
    <CartProvider stockSheet={stockSheet}>
      <div className="pizza-shop">
        <Cart isOpen={true} />
        <Menu 
          pizzas={pizzas} 
          stockSheet={stockSheet}
          isOpen={true} 
        />
      </div>
    </CartProvider>
  );
};


export default PizzaShop;

// PizzaShop.jsx
import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import Menu from "./Menu";
import { useEvents } from "../contexts/EventsContext";
import { CartProvider } from "../contexts/CartContext";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const [stockSheet, setStockSheet] = useState([]);
  const { events, isOpen, loading } = useEvents();

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
  if (loading || pizzas.length === 0 || stockSheet.length === 0) {
    return <p>Laden…</p>;
  }
  console.log(stockSheet);
  

  return (
    <CartProvider stockSheet={stockSheet}>
      <div className="pizza-shop">
        <Cart isOpen={isOpen} />
        <Menu 
          pizzas={pizzas} 
          stockSheet={stockSheet} 
          events={events} 
          isOpen={isOpen} 
        />
      </div>
    </CartProvider>
  );
};


export default PizzaShop;

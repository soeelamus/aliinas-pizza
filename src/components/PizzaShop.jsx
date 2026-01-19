import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import Menu from "./Menu";
import { useEvents } from "../contexts/EventsContext";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const [stockSheet, setStockSheet] = useState([]);
  const { events, isOpen, loading } = useEvents(); // get global events & isOpen

  // Fetch pizzas
  useEffect(() => {
    fetch("/json/pizzas.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch stockSheet
  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then(setStockSheet)
      .catch(console.error);
  }, []);

  // Optionally show loading state until events are loaded
  if (loading) return <p>Even geduld, het menu wordt geladen…</p>;

  return (
    <div className="pizza-shop">
      <Cart isOpen={isOpen} />
      <Menu pizzas={pizzas} stockSheet={stockSheet} events={events} isOpen={isOpen} />
    </div>
  );
};

export default PizzaShop;

import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import Menu from "./Menu";
import { useEvents } from "../contexts/EventsContext";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const { events, isOpen, loading } = useEvents(); // get global events & isOpen

  // Fetch pizzas
  useEffect(() => {
    fetch("/json/pizzas.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch drinks
  useEffect(() => {
    fetch("/api/stock?type=drink")
      .then((res) => res.json())
      .then(setDrinks)
      .catch(console.error);
  }, []);

  // Optionally show loading state until events are loaded
  if (loading) return <p>Even geduld, het menu wordt geladen…</p>;

  return (
    <div className="pizza-shop">
      <Cart isOpen={isOpen} />
      <Menu pizzas={pizzas} drinks={drinks} events={events} isOpen={isOpen} />
    </div>
  );
};

export default PizzaShop;

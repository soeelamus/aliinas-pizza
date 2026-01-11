import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import Menu from "./Menu";
import { fetchEvents } from "../utils/fetchEvents";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const [events, setEvents] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch pizzas
  useEffect(() => {
    fetch("/json/data.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch events en bepaal of we open zijn
  useEffect(() => {
    const loadEvents = async () => {
      const data = await fetchEvents();
      setEvents(data);

      const today = new Date().toISOString().slice(0, 10);
      const openToday = data.some(
        (e) => e.type.toLowerCase() === "standplaats" && e.date === today
      );

      setIsOpen(openToday);
    };

    loadEvents();
  }, []);

  return (
    <div className="pizza-shop">
      {/* Cart haalt zelf data uit CartContext */}
      <Cart isOpen={isOpen} />

      {/* Menu voegt items toe via CartContext */}
      <Menu pizzas={pizzas} events={events} isOpen={isOpen} />
    </div>
  );
};

export default PizzaShop;

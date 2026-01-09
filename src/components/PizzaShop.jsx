import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import Menu from "./Menu";
import { fetchEvents } from "../utils/fetchEvents";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [events, setEvents] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  

  // Sla cart op in localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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
      

      // vandaag in format YYYY-MM-DD
      const today = new Date().toISOString().slice(0, 10);
      const openToday = data.some(
        (e) => e.type.toLowerCase() === "standplaats" && e.date === today
      );
      setIsOpen(openToday);
    };
    loadEvents();
  }, []);

  // Cart handlers
  const addPizzaToCart = (pizza) => {
    const existing = cart.find((item) => item.product.id === pizza.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === pizza.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product: pizza, quantity: 1 }]);
    }
  };

  const removePizzaFromCart = (pizza) => {
    setCart(cart.filter((item) => item.product.id !== pizza.id));
  };

  const changeQuantity = (pizza, delta) => {
    setCart(
      cart
        .map((item) =>
          item.product.id === pizza.id
            ? { ...item, quantity: Math.max(item.quantity + delta, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalAmount = () =>
    cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <div className="pizza-shop">
      <Cart
        cart={cart}
        removePizzaFromCart={removePizzaFromCart}
        changeQuantity={changeQuantity}
        totalAmount={totalAmount}
        isOpen={isOpen}
      />

      <Menu
        pizzas={pizzas}
        addPizzaToCart={addPizzaToCart}
        events={events}
        isOpen={isOpen}
      />
    </div>
  );
};

export default PizzaShop;

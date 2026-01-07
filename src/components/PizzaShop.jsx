import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import Menu from "./Menu";

const PizzaShop = () => {
  const [pizzas, setPizzas] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch("/json/data.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch((err) => console.error(err));
  }, []);

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
        .filter((item) => item.quantity > 0) // verwijder items met 0
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
      />
      <Menu pizzas={pizzas} addPizzaToCart={addPizzaToCart} />
    </div>
  );
};

export default PizzaShop;

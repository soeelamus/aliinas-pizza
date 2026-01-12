// Menu.jsx
import React from "react";
import OrderDate from "./OrderDate";
import { useCart } from "../contexts/CartContext";

const Menu = ({ pizzas, events, isOpen }) => {
  const { addPizza } = useCart();

  return (
    <div id="3" className="menu">
      <OrderDate events={events} />

      <div className="menu-box">
        <h2 className="monoton-regular">Menu</h2>

        <div className="pizza-box">
          {pizzas.map((pizza) => {
            const ingredients = pizza.ingredients?.map(i => i.name).join(" • ");

            return (
              <div key={pizza.id} className="pizza">
                <div className="pizza-text">
                  <h3 className="pizza-name">
                    {pizza.name}{" "}
                    <span className="pizza-symbol">{pizza.type}</span>
                  </h3>

                  <div className="price-box">
                    <h3 className="pizza-price">€{pizza.price}</h3>

                    <button
                      className="btn-small btn-purple"
                      onClick={() => addPizza(pizza)}
                      disabled={!isOpen}
                      title={
                        !isOpen
                          ? "We zijn vandaag gesloten"
                          : "Toevoegen aan bestelling"
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <p className="pizza-ingredients">{ingredients}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Menu;

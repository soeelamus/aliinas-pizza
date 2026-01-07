import React, { useEffect, useState } from "react";

const Menu = () => {
  const [pizzas, setPizzas] = useState([]);

  useEffect(() => {
fetch("/json/data.json") // starts with / because it's in public
  .then(response => response.json())
  .then(data => setPizzas(data.Pizzas))
  .catch(error => console.error("Error loading data.json", error));

  }, []);

  return (
    <div className="menu">
    <div id="3" className="menu-box">
      <h2 className="monoton-regular">Menu</h2>
      <div className="pizza-box" id="pizza-box">
        {pizzas.map((pizza) => {
          const ingredients = pizza.ingredients.map((i) => i.name).join(" • ");
          return (
            <div key={pizza.id} className="pizza">
              <div className="pizza-text">
                <h3 className="pizza-name">
                  {pizza.name} <span className="pizza-symbol pizza-spicy">{pizza.type}</span>
                </h3>
                <div className="price-box">
                  <h3 className="pizza-price">{pizza.price}</h3>
                  <button className="btn-small btn-purple">+</button>
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

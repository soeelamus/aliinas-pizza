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
    <div id="3" className="menu-box">
      <header className="major">
        <h2>Ons Menu</h2>
        <p className="menu-description">
          Ons deeg maken we voor elk evenement vers, met hoogwaardige Italiaanse bloem.
        </p>
      </header>

      <div className="pizza-box" id="pizza-box">
        {pizzas.map((pizza) => {
          const ingredients = pizza.ingredients.map((i) => i.name).join(" • ");
          return (
            <div key={pizza.id} className="pizza">
              <div className="img-box">
                <img
                  loading="lazy"
                  className="img-pizza"
                  src={`/images/pizzas/${pizza.id}.jpg`}
                  alt={`Pizza ${pizza.name}`}
                />
              </div>
              <div className="pizza-text">
                <h3 className="pizza-name">
                  {pizza.name} <span className="pizza-symbol pizza-spicy">{pizza.type}</span>
                </h3>
                <h3 className="pizza-price">{pizza.price}.-</h3>
              </div>
              <p className="pizza-ingredients">{ingredients}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Menu;

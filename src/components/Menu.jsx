// Menu.jsx
import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";

const Menu = ({ pizzas, stockSheet, isOpen }) => {
  const { addItem, getStock, cart } = useCart();
  const [activeTab, setActiveTab] = useState("Pizza"); // default tab

  // --- Unieke categorieën ophalen uit stockSheet + Pizza tab
  const categories = [
    "Pizza",
    ...Array.from(
      new Set(stockSheet.map((item) => item.category).filter(Boolean)),
    ),
  ];

  // --- Items die we gaan renderen, afhankelijk van tab
  const itemsToRender =
    activeTab === "Pizza"
      ? pizzas
      : stockSheet.filter((item) => item.category === activeTab);

  return (
    <div className="menu">
      <div id="3" className="menu-box">
        <h2 className="monoton-regular">Menu</h2>

        {/* --- Tab navigatie --- */}
        <nav className="menu-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={activeTab === cat ? "active btn-purple" : "btn-purple"}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </nav>

        <div className="pizza-box">
          {itemsToRender.map((item) => {
            const description =
              activeTab === "Pizza"
                ? item.ingredients?.map((i) => i.name).join(" • ")
                : "";

            return (
              <div key={item.id} className="pizza">
                <div className="pizza-text">
                  <h3 className="pizza-name">
                    {item.name}{" "}
                    {activeTab === "Pizza" && (
                      <span className="pizza-symbol">{item.type}</span>
                    )}
                  </h3>

                  <div className="price-box">
                    <h3 className="pizza-price">€{item.price}</h3>
                    <button
                      className="btn-small btn-purple"
                      onClick={() => addItem(item)}
                      disabled={
                        !isOpen || // winkel gesloten
                        getStock(item, cart) <= 0 // stock check
                      }
                      title={
                        !isOpen
                          ? "We zijn vandaag gesloten"
                          : stockSheet.length === 0
                            ? "Stock laden..."
                            : getStock(item, cart) <= 0
                              ? "Uitverkocht"
                              : "Toevoegen aan bestelling"
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                {description && (
                  <p className="pizza-ingredients">{description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Menu;

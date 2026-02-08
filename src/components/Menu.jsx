// Menu.jsx
import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";
import Loading from "./Loading/Loading";

const Menu = ({ pizzas, stockSheet = [], isOpen, isKitchen }) => {
  const { addItem, getStock, cart } = useCart();
  const [activeTab, setActiveTab] = useState("Pizza");

 const hasStock = stockSheet.length > 0;

const categories = hasStock
  ? [
      "Pizza",
      ...Array.from(
        new Set(stockSheet.map((item) => item.category).filter(Boolean))
      ),
    ]
  : [];

  const itemsToRender =
    activeTab === "Pizza"
      ? pizzas
      : stockSheet.filter((item) => item.category === activeTab);

  return (
    <div className="menu">
      <div className="menu-box">
        <h2 className="monoton-regular">Menu</h2>

        {/* --- Tab navigatie --- */}
        <nav className="menu-tabs">
          {categories
            .filter((cat) => isKitchen || cat !== "Extra")
            .map((cat) => (
              <button
                key={cat}
                className={
                  activeTab === cat ? "active btn-purple" : "btn-purple"
                }
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
                    <h3 className="pizza-price">
                      {item.price != null ? `${item.price}` : ""}
                    </h3>
                    {isOpen && (
                      <button
                        className="btn-small btn-purple"
                        onClick={() => addItem(item)}
                        disabled={!isOpen || getStock(item, cart) <= 0}
                        title={
                          stockSheet.length === 0 ? (
                            <Loading innerHTML={"Stock laden"} />
                          ) : getStock(item, cart) <= 0 ? (
                            "Uitverkocht"
                          ) : (
                            "Toevoegen aan bestelling"
                          )
                        }
                      >
                        +
                      </button>
                    )}
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

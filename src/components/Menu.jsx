// Menu.jsx
import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";

const Menu = ({ pizzas, stockSheet = [], isOpen, isKitchen }) => {
  const { addItem, getStock, cart } = useCart();
  const [activeTab, setActiveTab] = useState("Pizza");

  const hasStock = stockSheet.length > 0;

  const categories = [
    "Pizza",
    ...Array.from(
      new Set(stockSheet.map((item) => item.category).filter(Boolean)),
    ),
  ];

  const itemsToRender =
    activeTab === "Pizza"
      ? pizzas
      : stockSheet.filter((item) => item.category === activeTab);

  return (
    <div className="menu">
      <div className="menu-box">
        <h2 className="monoton-regular">Menu</h2>

        <nav className="menu-tabs">
          {categories
            .filter((cat) => hasStock && (isKitchen || cat !== "Extra"))
            .map((cat) => (
              <button
                key={cat}
                className={`btn-purple ${activeTab === cat ? "active" : ""}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat}
              </button>
            ))}
        </nav>

        <div className="pizza-box">
          {itemsToRender.map((item) => {
            const stock = getStock(item, cart, { isKitchen });
            const hasItemStock = stock > 0;
            const isPizza = activeTab === "Pizza";

            const isItemAvailable =
              typeof item.stock === "number" ? item.stock : hasItemStock;

            const dashed = !isItemAvailable ? "dashed" : "";
            const canAdd =
              isOpen && hasStock && isItemAvailable && hasItemStock;

            const description = isPizza
              ? item.ingredients?.map((i) => i.name.toLowerCase()).join(" • ")
              : "";

            const title = !hasStock
              ? "Stock laden"
              : !hasItemStock || !isItemAvailable
                ? "Uitverkocht"
                : "Toevoegen aan bestelling";

            return (
              <div
                key={item.id}
                className={`pizza ${item.special && "pizza-special"}`}
              >
                <div className="pizza-text">
                  <h3 className={`pizza-name ${dashed}`}>
                    {item.name}
                    {isPizza && (
                      <span className="pizza-symbol">{item.type}</span>
                    )}
                  </h3>

                  <div className="price-box">
                    <h3 className={`pizza-price ${dashed}`}>
                      {item.price % 1 === 0 ? (
                        item.price
                      ) : (
                        <>
                          {Math.floor(item.price)}
                          <span className="decimals">
                            {item.price.toFixed(2).split(".")[1]}
                          </span>
                        </>
                      )}
                    </h3>

                    {isOpen && hasStock && (
                      <button
                        className="btn-small btn-purple"
                        onClick={() => addItem(item, { isKitchen })}
                        disabled={!canAdd}
                        title={title}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {item.info && <p className="pizza-ingredients">{item.info}</p>}
                {description && (
                  <p className="pizza-ingredients">{description}</p>
                )}
                {item.size !== 0 && (
                  <p className="pizza-ingredients">{item.size}</p>
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

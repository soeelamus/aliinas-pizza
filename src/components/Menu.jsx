// Menu.jsx
import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";

const Menu = ({ pizzas, stockSheet = [], isOpen, isKitchen }) => {
  const { addItem, addMenu, getStock, cart } = useCart();
  const [activeTab, setActiveTab] = useState("Pizza");
  const [menuBuilder, setMenuBuilder] = useState({
    open: false,
    pizza: null,
    drink: null,
    dessert: null,
  });

  const hasStock = stockSheet.length > 0;
  const pizzaItems = pizzas;
  const menuItems = pizzas.map((p) => ({
    ...p,
    name: `${p.name} Menu`,
    price: p.menuPrice,
  }));

  const categories = [
    "Pizza",
    "Menu",
    ...Array.from(
      new Set(stockSheet.map((item) => item.category).filter(Boolean)),
    ),
  ];

  const itemsToRender =
    activeTab === "Pizza"
      ? pizzaItems
      : activeTab === "Menu"
        ? menuItems
        : stockSheet.filter((item) => item.category === activeTab);

  const drinks = stockSheet.filter((item) => item.category === "Drank");

  const desserts = stockSheet.filter((item) => item.category === "Dessert");
  const formatName = (name) =>
    name
      .toLowerCase()
      .replace(/\s+/g, "") // spaties weg
      .replace(/[^a-z0-9]/g, ""); // speciale tekens weg
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
            const isPizza = activeTab === "Pizza" || activeTab === "Menu";
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
                    {item.special && (
                      <span className="pizza-special--tag">special</span>
                    )}
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
                        onClick={() => {
                          if (activeTab === "Menu") {
                            setMenuBuilder({
                              open: true,
                              pizza: item,
                              drink: null,
                              dessert: null,
                            });

                            return;
                          }

                          addItem(item, { isKitchen });
                        }}
                        disabled={!canAdd}
                        title={title}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {activeTab === "Menu" && (
                  <p className="pizza-ingredients">Pizza + Drankje + Dessert</p>
                )}
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
      {menuBuilder.open && (
        <div className="checkout-popup-overlay">
          <div className="checkout-popup">
            {!menuBuilder.drink && (
              <>
                <p>Kies een drankje</p>

                <div className="menu-options">
                  {drinks.map((drink) => (
                    <div className="menu-option">
                      <button
                        key={drink.id}
                        className="menu-options--item"
                        style={{
                          backgroundImage: `url(/images/products/${formatName(drink.name)}.jpg)`,
                        }}
                        onClick={() =>
                          setMenuBuilder((prev) => ({
                            ...prev,
                            drink,
                          }))
                        }
                      ></button>
                      <span className="menu-options--name"> {drink.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {menuBuilder.drink && !menuBuilder.dessert && (
              <>
                <p>Kies een dessert</p>

                <div className="menu-options">
                  {desserts.map((dessert) => (
                    <div className="menu-option">
                      <button
                        key={dessert.id}
                        className="menu-options--item"
                        style={{
                          backgroundImage: `url(/images/products/${formatName(dessert.name)}.jpg)`,
                        }}
                        onClick={() => {
                          setMenuBuilder((prev) => ({
                            ...prev,
                            dessert,
                          }));

                          addMenu(
                            menuBuilder.pizza,
                            menuBuilder.drink,
                            dessert,
                            menuBuilder.pizza.menuPrice,
                            { isKitchen },
                          );

                          setMenuBuilder({
                            open: false,
                            pizza: null,
                            drink: null,
                            dessert: null,
                          });
                        }}
                      ></button>
                      <span className="menu-options--name">
                        {" "}
                        {dessert.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              className="btn-purple"
              onClick={() =>
                setMenuBuilder({
                  open: false,
                  pizza: null,
                  drink: null,
                  dessert: null,
                })
              }
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;

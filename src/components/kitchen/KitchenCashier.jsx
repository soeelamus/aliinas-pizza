// KitchenCashier.jsx
import React, { useState, useEffect } from "react";
import Cart from "../Cart";
import Menu from "../Menu";
import { useCart } from "../../contexts/CartContext";
import Loading from "../Loading/Loading";

const KitchenCashier = () => {
  const [pizzas, setPizzas] = useState([]);
  const { stockSheetState, setStockSheetState } = useCart();

  // Fetch pizzas
  useEffect(() => {
    fetch("/json/pizzas.json")
      .then((res) => res.json())
      .then((data) => setPizzas(data.Pizzas || []))
      .catch(console.error);
  }, []);

  // Wacht tot alles geladen is
  if (pizzas.length === 0 || stockSheetState.length === 0) {
    return <Loading innerHTML={"Loading cashier"} />;
  }

  console.log("stockSheetState[0] =", stockSheetState[0]);
  console.log(
    "unique category keys:",
    Object.keys(stockSheetState[0] || {}).filter((k) =>
      k.toLowerCase().includes("cat"),
    ),
  );

  return (
    <div className="pizza-shop">
      <Cart isOpen={true} />
      <Menu
        pizzas={pizzas}
        stockSheet={stockSheetState}
        isOpen={true}
        isKitchen={true}
      />
    </div>
  );
};

export default KitchenCashier;

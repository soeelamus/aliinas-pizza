// KitchenCashier.jsx
import React from "react";
import Cart from "../Cart";
import Menu from "../Menu";
import { useCart } from "../../contexts/CartContext";
import Loading from "../Loading/Loading";

const KitchenCashier = () => {
  const { stockSheetState } = useCart();

  // Wacht tot stock geladen is
  if (stockSheetState.length === 0) {
    return <Loading innerHTML={"Loading cashier"} />;
  }

  return (
    <div className="pizza-shop">
      <Cart isOpen={true} />
      <Menu
        stockSheet={stockSheetState}
        isOpen={true}
        isKitchen={true}
      />
    </div>
  );
};

export default KitchenCashier;
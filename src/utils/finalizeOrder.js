export async function finalizeOrder({
  cart,
  total,
  paymentMethod, // "cash" | "card"
  customerName = "",
  pickupTime = "ASAP",
}) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("Cart is leeg");
  }

  /* -------------------
     1️⃣ Build order
  -------------------- */

  const orderObj = {
    id: Date.now().toString(),
    paymentId: paymentMethod,
    items: cart
      .map((i) => `${i.quantity}x ${i.product.name}`)
      .join(", "),
    total,
    pickupTime,
    orderedTime: new Date().toISOString(),
    customerName,
    status: "new",
  };

  /* -------------------
     2️⃣ Push order
  -------------------- */

  const orderRes = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderObj),
  });

  if (!orderRes.ok) {
    throw new Error("Order push failed");
  }

  /* -------------------
     3️⃣ Fetch stock
  -------------------- */

  const stockRes = await fetch("/api/stock");
  if (!stockRes.ok) {
    throw new Error("Stock fetch failed");
  }

  const stockData = await stockRes.json();

  /* -------------------
     4️⃣ Build stock updates
  -------------------- */

  const grouped = [];

  cart.forEach((item) => {
    let stockItem = stockData.find(
      (s) => s.name === item.product.name,
    );

    // fallback → deegballen
    if (!stockItem) {
      stockItem = stockData[0];
    }

    const existing = grouped.find(
      (g) => g.id === stockItem.id,
    );

    if (existing) {
      existing.stock -= item.quantity;
    } else {
      grouped.push({
        id: stockItem.id,
        stock: stockItem.stock - item.quantity,
      });
    }
  });

  const updateData = grouped.map((g) => ({
    id: g.id,
    stock: Math.max(0, g.stock),
  }));

  /* -------------------
     5️⃣ Push stock
  -------------------- */

  const stockUpdateRes = await fetch("/api/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });

  if (!stockUpdateRes.ok) {
    throw new Error("Stock update failed");
  }

  /* -------------------
     6️⃣ Clear local
  -------------------- */

  localStorage.removeItem("cart");

  return {
    success: true,
    order: orderObj,
  };
}

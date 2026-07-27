const PRODUCT_IDS_BY_NAME = {
  Margheriita: 1489,
  Fungii: 2652,
  Formagii: 4535,
  Vegii: 3498,
  Pepperonii: 9445,
  Hawaii: 2357,
  Jaeger: 5321,
  "Sweet Chiicken": 6897,
  "Spicy Chiicken": 8123,
  Diiavola: 7565,
};

function resolveProductId(itemOrProduct) {
  const product = itemOrProduct?.product ?? itemOrProduct;

  const possibleId =
    product?.id ??
    itemOrProduct?.product_id ??
    itemOrProduct?.productId ??
    itemOrProduct?.id;

  const numericId = Number(possibleId);

  if (Number.isInteger(numericId) && numericId > 0) {
    return numericId;
  }

  const productName =
    product?.name ?? itemOrProduct?.product_name ?? itemOrProduct?.name;

  const fallbackId = PRODUCT_IDS_BY_NAME[productName];

  if (fallbackId) {
    return fallbackId;
  }

  throw new Error(
    `Product-ID ontbreekt voor ${productName || "onbekend product"}`,
  );
}

function buildOrderItems(cart) {
  const orderItems = [];

  cart.forEach((item) => {
    const quantity = Number(item.quantity || 1);

    // Menu
    if (item.type === "menu" && item.menu) {
      const pizza = item.menu.pizza;
      const drink = item.menu.drink;
      const dessert = item.menu.dessert;

      if (!pizza?.id) {
        throw new Error(
          `Pizza-ID ontbreekt voor ${pizza?.name || "onbekende pizza"}`,
        );
      }

      const menuPrice = Number(
        item.product?.price ??
          item.price ??
          pizza.menuPrice ??
          pizza.price ??
          0,
      );

      orderItems.push({
        product_id: Number(pizza.id),
        product_name: pizza.name,
        quantity,
        unit_price: menuPrice,
        line_total: menuPrice * quantity,
        item_type: "menu_main",
        metadata: {
          menu: true,
          component: "pizza",
        },
      });

      if (drink) {
        if (!drink.id) {
          throw new Error(
            `Drank-ID ontbreekt voor ${drink.name || "onbekende drank"}`,
          );
        }

        orderItems.push({
          product_id: Number(drink.id),
          product_name: drink.name,
          quantity,
          unit_price: 0,
          line_total: 0,
          item_type: "menu_component",
          metadata: {
            component: "drink",
            included_in_menu: true,
          },
        });
      }

      if (dessert) {
        if (!dessert.id) {
          throw new Error(
            `Dessert-ID ontbreekt voor ${dessert.name || "onbekend dessert"}`,
          );
        }

        orderItems.push({
          product_id: Number(dessert.id),
          product_name: dessert.name,
          quantity,
          unit_price: 0,
          line_total: 0,
          item_type: "menu_component",
          metadata: {
            component: "dessert",
            included_in_menu: true,
          },
        });
      }

      return;
    }

    // Los product
    if (!item.product?.id) {
      throw new Error(
        `Product-ID ontbreekt voor ${item.product?.name || "onbekend product"}`,
      );
    }

    const unitPrice = Number(item.price ?? item.product.price ?? 0);

    orderItems.push({
      product_id: Number(item.product.id),
      product_name: item.product.name,
      quantity,
      unit_price: unitPrice,
      line_total: unitPrice * quantity,
      item_type: item.product.product_type ?? item.type ?? "product",
      metadata: {},
    });
  });

  return orderItems;
}

export async function finalizeOrder({
  cart,
  total,
  paymentMethod,
  customerName = "",
  customerEmail = null,
  customerNotes = "",
  pickupTime = "ASAP",
  sessionId,
}) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("Cart is leeg");
  }

  const orderId = sessionId ?? Date.now().toString();

  const paymentId = sessionId
    ? String(sessionId)
    : `${paymentMethod}-${orderId}`;

  const orderItems = buildOrderItems(cart);

  console.log("ORDER ITEMS:", JSON.stringify(orderItems, null, 2));

  const orderObj = {
    id: String(orderId),
    sessionId: paymentId,
    paymentMethod,
    items: orderItems,
    total: Number(total),
    pickupTime,
    pickupDate: new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
    orderedTime: new Date().toISOString(),
    customerName,
    customerEmail,
    customerNotes,
    status: "new",
  };

  console.log("orderObj:", orderObj);

  const orderRes = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderObj),
  });

  let orderData;

  try {
    orderData = await orderRes.json();
  } catch {
    throw new Error("Ongeldige response van de order-API");
  }

  if (!orderRes.ok) {
    throw new Error(orderData.error || "Bestelling kon niet opgeslagen worden");
  }

  localStorage.removeItem("cart");

  return {
    success: true,
    status: orderData.status,
    order: orderData.order,
  };
}

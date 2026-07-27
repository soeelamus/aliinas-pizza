// /api/dashboard.js
import { supabase } from "../src/lib/supabase.js";

function hasEmployeesAccess(req) {
  const cookies = req.headers.cookie || "";
  const headerToken = req.headers["x-employees-token"];

  return (
    cookies.includes(`employeesAuth=${process.env.API_TOKEN}`) ||
    headerToken === process.env.API_TOKEN
  );
}

function getDefaultStartDate() {
  const date = new Date();

  date.setDate(date.getDate() - 6);
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

function getDefaultEndDate() {
  const date = new Date();

  date.setHours(23, 59, 59, 999);

  return date.toISOString();
}

function normalizeDateStart(value) {
  if (!value) return getDefaultStartDate();

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return getDefaultStartDate();
  }

  return date.toISOString();
}

function normalizeDateEnd(value) {
  if (!value) return getDefaultEndDate();

  const date = new Date(`${value}T23:59:59.999`);

  if (Number.isNaN(date.getTime())) {
    return getDefaultEndDate();
  }

  return date.toISOString();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  if (!hasEmployeesAccess(req)) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  try {
    const { startDate, endDate, paymentMethod, weekday } = req.query ?? {};

    const start = normalizeDateStart(startDate);
    const end = normalizeDateEnd(endDate);

    let ordersQuery = supabase
      .from("orders")
      .select(
        `
        id,
        external_id,
        payment_id,
        payment_method,
        total,
        pickup_time,
        pickup_date,
        ordered_at,
        customer_name,
        customer_email,
        customer_notes,
        status,
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          line_total,
          item_type,
          metadata,
          created_at,
          products (
            category,
            product_type
          )
        )
      `,
      )
      .gte("ordered_at", start)
      .lte("ordered_at", end)
      .order("ordered_at", {
        ascending: false,
      });

    if (paymentMethod) {
      ordersQuery = ordersQuery.eq("payment_method", String(paymentMethod));
    }

    const { data: orders, error } = await ordersQuery;

    if (error) {
      throw error;
    }

    const safeOrders = orders || [];

    const requestedWeekday =
      weekday === undefined || weekday === null || weekday === ""
        ? null
        : Number(weekday);

    const weekdayFilteredOrders =
      requestedWeekday === null
        ? safeOrders
        : safeOrders.filter((order) => {
            if (!order.pickup_date) return false;

            const date = new Date(`${order.pickup_date}T12:00:00`);

            return date.getDay() === requestedWeekday;
          });

    const completedOrders = weekdayFilteredOrders.filter(
      (order) => order.status !== "cancelled",
    );

    const revenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    const orderCount = completedOrders.length;

    const itemCount = completedOrders.reduce(
      (sum, order) =>
        sum +
        (order.order_items || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0,
        ),
      0,
    );

    const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    const revenueByDayMap = {};
    const paymentMethodsMap = {};
    const productsMap = {};
    const categoriesMap = {
      pizza: 0,
      drink: 0,
      dessert: 0,
      extra: 0,
      other: 0,
    };

    completedOrders.forEach((order) => {
      const day =
        order.pickup_date || String(order.ordered_at || "").slice(0, 10);

      if (!revenueByDayMap[day]) {
        revenueByDayMap[day] = {
          date: day,
          revenue: 0,
          orders: 0,
          items: 0,
        };
      }

      revenueByDayMap[day].revenue += Number(order.total || 0);

      revenueByDayMap[day].orders += 1;

      const paymentMethod = order.payment_method || "unknown";

      if (!paymentMethodsMap[paymentMethod]) {
        paymentMethodsMap[paymentMethod] = {
          paymentMethod,
          revenue: 0,
          orders: 0,
        };
      }

      paymentMethodsMap[paymentMethod].revenue += Number(order.total || 0);

      paymentMethodsMap[paymentMethod].orders += 1;

      (order.order_items || []).forEach((item) => {
        const quantity = Number(item.quantity || 0);

        revenueByDayMap[day].items += quantity;

        const productKey = item.product_id || item.product_name;

        if (!productsMap[productKey]) {
          productsMap[productKey] = {
            productId: item.product_id,
            productName: item.product_name,
            quantity: 0,
            revenue: 0,
            itemType: item.item_type,
          };
        }

        productsMap[productKey].quantity += quantity;
        productsMap[productKey].revenue += Number(item.line_total || 0);

        const metadataComponent = item.metadata?.component;

        const productCategory = String(
          item.products?.category || "",
        ).toLowerCase();

        const productType = String(
          item.products?.product_type || "",
        ).toLowerCase();

        if (
          item.item_type === "menu_main" ||
          metadataComponent === "pizza" ||
          productType === "pizza" ||
          productCategory === "pizza"
        ) {
          categoriesMap.pizza += quantity;
        } else if (
          metadataComponent === "drink" ||
          productCategory === "drank" ||
          productCategory === "bier" ||
          productCategory === "energy"
        ) {
          categoriesMap.drink += quantity;
        } else if (
          metadataComponent === "dessert" ||
          productCategory === "dessert"
        ) {
          categoriesMap.dessert += quantity;
        } else if (item.item_type === "extra" || productCategory === "extra") {
          categoriesMap.extra += quantity;
        } else {
          categoriesMap.other += quantity;
        }
      });
    });

    const revenueByDay = Object.values(revenueByDayMap).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );

    const paymentMethods = Object.values(paymentMethodsMap).sort(
      (a, b) => b.revenue - a.revenue,
    );

    const bestsellers = Object.values(productsMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const categorySales = Object.entries(categoriesMap).map(
      ([category, quantity]) => ({
        category,
        quantity,
      }),
    );

    return res.status(200).json({
      ok: true,

      filters: {
        startDate: start,
        endDate: end,
        paymentMethod: paymentMethod || null,
        weekday: requestedWeekday,
      },

      summary: {
        revenue,
        orderCount,
        itemCount,
        averageOrderValue,
      },

      revenueByDay,
      paymentMethods,
      bestsellers,
      categorySales,

      recentOrders: weekdayFilteredOrders.slice(0, 20),
    });
  } catch (error) {
    console.error("API /dashboard error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Server error",
    });
  }
}

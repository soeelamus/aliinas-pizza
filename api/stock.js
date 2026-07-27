// /api/stock.js
import { supabase } from "../src/lib/supabase.js";

const CATEGORY_MAP = {
  drink: "Drank",
  drinks: "Drank",
  drank: "Drank",

  dessert: "Dessert",
  desserts: "Dessert",

  beer: "Bier",
  bier: "Bier",

  energy: "Energy",
  extra: "Extra",
  pizza: "Pizza",
};

function hasKitchenAccess(req) {
  const cookies = req.headers.cookie || "";
  const headerToken = req.headers["x-kitchen-token"];

  return (
    cookies.includes(`kitchenAuth=${process.env.API_TOKEN}`) ||
    headerToken === process.env.API_TOKEN
  );
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    size: product.description || "",
    description: product.description || "",
    price: Number(product.price || 0),
    type: product.type || "",

    menuPrice:
      product.menu_price === null || product.menu_price === undefined
        ? null
        : Number(product.menu_price),

    stock:
      product.stock === null || product.stock === undefined
        ? null
        : Number(product.stock),

    category: product.category || "",
    product_type: product.product_type || "product",
    track_stock: Boolean(product.track_stock),
    active: Boolean(product.active),

    ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],

    allergens: Array.isArray(product.allergens) ? product.allergens : [],

    updated_at: product.updated_at,

    display_order:
      product.display_order === null || product.display_order === undefined
        ? null
        : Number(product.display_order),
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-kitchen-token",
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // =====================================================
    // GET
    // =====================================================

    if (req.method === "GET") {
      const { type, category, includeInactive } = req.query ?? {};

      let query = supabase
        .from("products")
        .select(
          `
  id,
  name,
  description,
  price,
  menu_price,
  stock,
  category,
  product_type,
  type,
  track_stock,
  active,
  ingredients,
  allergens,
  updated_at,
  display_order
`,
        )
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (String(includeInactive) !== "true") {
        query = query.eq("active", true);
      }

      const requestedCategory = category || type;

      if (requestedCategory) {
        const normalized = String(requestedCategory).trim().toLowerCase();

        const mappedCategory =
          CATEGORY_MAP[normalized] || String(requestedCategory).trim();

        query = query.eq("category", mappedCategory);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json((data || []).map(normalizeProduct));
    }

    // =====================================================
    // POST - MANUELE STOCKUPDATE
    // =====================================================

    if (req.method === "POST") {
      if (!hasKitchenAccess(req)) {
        return res.status(401).json({
          ok: false,
          error: "Unauthorized",
        });
      }

      const incomingUpdates = Array.isArray(req.body) ? req.body : [req.body];

      const validUpdates = incomingUpdates
        .map((item) => {
          const id = Number(item?.id);
          const stock = Number(item?.stock);

          return {
            id,
            stock,
          };
        })
        .filter(
          (item) =>
            Number.isInteger(item.id) &&
            item.id > 0 &&
            Number.isFinite(item.stock),
        );

      if (validUpdates.length === 0) {
        return res.status(400).json({
          ok: false,
          error: "Geen geldige stockupdates ontvangen",
        });
      }

      const updatedProducts = [];

      for (const update of validUpdates) {
        const { data, error } = await supabase
          .from("products")
          .update({
            stock: Math.max(0, update.stock),
            updated_at: new Date().toISOString(),
          })
          .eq("id", update.id)
          .select(
            `
  id,
  name,
  description,
  price,
  menu_price,
  stock,
  category,
  product_type,
  type,
  track_stock,
  active,
  ingredients,
  allergens,
  updated_at,
  display_order
`,
          )
          .single();

        if (error) {
          throw error;
        }

        updatedProducts.push(normalizeProduct(data));
      }

      return res.status(200).json({
        ok: true,
        updated: updatedProducts,
      });
    }

    // =====================================================
    // METHOD NOT ALLOWED
    // =====================================================

    res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);

    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
      allowed: ["GET", "POST", "OPTIONS"],
    });
  } catch (error) {
    console.error("API /stock error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Server error",
    });
  }
}

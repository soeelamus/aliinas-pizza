import { supabaseAdmin } from "../../src/lib/supabaseAdmin.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        ingredients,
        allergens,
        display_order,
        type
      `)
      .eq("active", true)
      .eq("product_type", "pizza")
      .order("display_order", {
        ascending: true,
        nullsFirst: false,
      })
      .order("name", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const pizzas = (data || []).map((product) => ({
      id: Number(product.id),
      name: product.name,
      description: product.description || "",
      priceCents: Math.round(Number(product.price) * 100),
      ingredients: Array.isArray(product.ingredients)
        ? product.ingredients
        : [],
      allergens: Array.isArray(product.allergens)
        ? product.allergens
        : [],
      displayOrder: product.display_order,
      icon: product.type || "",
    }));

    return res.status(200).json({
      success: true,
      pizzas,
    });
  } catch (error) {
    console.error("Booking menu error:", error);

    return res.status(500).json({
      success: false,
      error: "Het pizzamenu kon niet worden geladen.",
    });
  }
}
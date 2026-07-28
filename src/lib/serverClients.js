import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabaseUrl =
  process.env.SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error(
    "SUPABASE_URL ontbreekt",
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY ontbreekt",
  );
}

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY ontbreekt",
  );
}

export const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

export const stripe = new Stripe(
  stripeSecretKey,
);
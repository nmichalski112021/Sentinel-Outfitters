/**
 * Creates Stripe products, prices, and Payment Links for the shop.
 *
 * Usage (PowerShell):
 *   $env:STRIPE_SECRET_KEY="sk_live_..."
 *   $env:SITE_URL="https://YOUR_USERNAME.github.io/YOUR_REPO"
 *   node scripts/create-stripe-links.mjs
 *
 * Catalog comes from js/products.js via server/load-products.mjs
 * (same source as checkout). Writes public Payment Link URLs into
 * js/stripe-config.js. Never put the secret key in website files.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProducts } from "../server/load-products.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const text = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* no .env file */
  }
}

loadEnv();

const secret = process.env.STRIPE_SECRET_KEY;
const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");

if (!secret || !secret.startsWith("sk_")) {
  console.error("Set STRIPE_SECRET_KEY to a Stripe secret key (sk_test_ or sk_live_).");
  process.exit(1);
}

/** Expand js/products.js into Stripe Payment Link rows (id or id:variant). */
function catalogFromProducts(products) {
  const rows = [];
  for (const product of products) {
    if (!product || !product.id) continue;
    const amount = Number(product.price);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid price for product: " + product.id);
    }
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variants.length) {
      for (const variant of variants) {
        const variantId = variant.id || variant;
        const variantName = variant.name || variantId;
        rows.push({
          key: product.id + ":" + variantId,
          name: product.name + " (" + variantName + ")",
          amount
        });
      }
    } else {
      rows.push({
        key: product.id,
        name: product.name,
        amount
      });
    }
  }
  return rows;
}

const catalog = catalogFromProducts(loadProducts(root));
if (!catalog.length) {
  console.error("No products loaded from js/products.js");
  process.exit(1);
}
console.log("Loaded " + catalog.length + " Payment Link SKUs from js/products.js");

async function stripe(path, params) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    body.append(key, String(value));
  }
  const res = await fetch("https://api.stripe.com/v1/" + path, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + secret,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(path + ": " + (data.error && data.error.message ? data.error.message : res.status));
  }
  return data;
}

const shippingRate = await stripe("shipping_rates", {
  display_name: "Free US shipping",
  type: "fixed_amount",
  "fixed_amount[amount]": "0",
  "fixed_amount[currency]": "usd"
});

const links = {};
for (const item of catalog) {
  const product = await stripe("products", {
    name: item.name,
    "metadata[sku]": item.key
  });
  const price = await stripe("prices", {
    product: product.id,
    currency: "usd",
    unit_amount: String(item.amount)
  });
  const payload = {
    "line_items[0][price]": price.id,
    "line_items[0][quantity]": "1",
    "line_items[0][adjustable_quantity][enabled]": "true",
    "line_items[0][adjustable_quantity][minimum]": "1",
    "line_items[0][adjustable_quantity][maximum]": "20",
    "shipping_address_collection[allowed_countries][0]": "US",
    "shipping_options[0][shipping_rate]": shippingRate.id,
    billing_address_collection: "auto"
  };
  if (siteUrl) {
    payload["after_completion[type]"] = "redirect";
    payload["after_completion[redirect][url]"] = siteUrl + "/success.html";
  }
  const link = await stripe("payment_links", payload);
  links[item.key] = link.url;
  console.log(item.key, link.url);
}

let existingCheckoutApiUrl = "";
try {
  const existing = readFileSync(resolve(root, "js", "stripe-config.js"), "utf8");
  const match = existing.match(/checkoutApiUrl:\s*("([^"]*)"|'([^']*)')/);
  if (match) existingCheckoutApiUrl = match[2] || match[3] || "";
} catch {
  /* no existing config */
}
if (!existingCheckoutApiUrl) {
  console.warn(
    "Warning: existing checkoutApiUrl not found; preserving empty string. Set it manually in js/stripe-config.js after this run."
  );
}
console.warn(
  "Note: this script creates new Stripe products/prices/links each run (not idempotent). Prefer one-shot use."
);

const file = `window.SO_STRIPE = {
  checkoutApiUrl: ${JSON.stringify(existingCheckoutApiUrl)},
  paymentLinks: ${JSON.stringify(links, null, 2)}
};
`;
writeFileSync(resolve(root, "js", "stripe-config.js"), file);
console.log("Wrote js/stripe-config.js (preserved checkoutApiUrl)");

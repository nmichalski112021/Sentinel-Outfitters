import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load the shop catalog from js/products.js (window.SO_PRODUCTS = [...]).
 * Keeps a single source of truth for current + future SKUs.
 */
export function loadProducts(rootDir) {
  const text = readFileSync(resolve(rootDir, "js/products.js"), "utf8");
  const match = text.match(/window\.SO_PRODUCTS\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("Could not parse window.SO_PRODUCTS from js/products.js");
  // Product data is author-controlled; evaluate the array literal only.
  const products = Function("return (" + match[1] + ")")();
  if (!Array.isArray(products)) throw new Error("SO_PRODUCTS is not an array");
  return products;
}

export function getProductById(rootDir, id) {
  return loadProducts(rootDir).find((p) => p && p.id === id) || null;
}

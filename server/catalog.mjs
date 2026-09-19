import { getProductById } from "./load-products.mjs";

/**
 * Build a Stripe Checkout line_item from a cart row using js/products.js
 * (via load-products) so charged prices match the shop UI.
 */
export function lineItemFromCart(item, rootDir) {
  const product = getProductById(rootDir, item.id);
  if (!product) throw new Error("Unknown product: " + item.id);

  const qty = Math.min(20, Math.max(1, Number(item.qty) || 1));
  const variantId = item.variant || "";
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variantMap = Object.fromEntries(
    variants.map((v) => [v.id, v.name || v.id])
  );

  if (variants.length) {
    if (!variantMap[variantId]) throw new Error("Unknown variant for " + item.id);
  }

  const label =
    variantId && variantMap[variantId]
      ? product.name + " (" + variantMap[variantId] + ")"
      : product.name;

  return {
    quantity: qty,
    price_data: {
      currency: "usd",
      unit_amount: product.price,
      product_data: {
        name: label,
        metadata: {
          sku: item.id,
          variant: variantId
        }
      }
    }
  };
}

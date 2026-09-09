export const CATALOG = {
  "diamondback-10x50-killflash": {
    name: "Vortex Diamondback 10x50 Killflash ARD 2-Pack",
    price: 5598,
    variants: { black: "Black", green: "Green" }
  },
  "holosun-hs510c-killflash": {
    name: "Holosun HS510C Killflash ARD",
    price: 1999,
    variants: { black: "Black", green: "Green" }
  },
  "sig-romeo5-gen1-killflash": {
    name: "Sig Romeo5 Gen 1 Killflash ARD",
    price: 1999,
    variants: { black: "Black", green: "Green" }
  },
  "scope-56mm-killflash": {
    name: "56mm Scope Killflash ARD",
    price: 2499,
    variants: { black: "Black", green: "Green" }
  },
  "keychain-pill-holder": {
    name: "Keychain Pill Holder (2-Pack)",
    price: 1299,
    variants: {}
  }
};

export function lineItemFromCart(item) {
  const product = CATALOG[item.id];
  if (!product) throw new Error("Unknown product: " + item.id);
  const qty = Math.min(20, Math.max(1, Number(item.qty) || 1));
  const variantId = item.variant || "";
  if (Object.keys(product.variants).length) {
    if (!product.variants[variantId]) throw new Error("Unknown variant for " + item.id);
  }
  const label = variantId && product.variants[variantId]
    ? product.name + " (" + product.variants[variantId] + ")"
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

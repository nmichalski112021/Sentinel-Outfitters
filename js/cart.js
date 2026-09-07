const SO_CART_KEY = "so-cart";

function soReadCart() {
  try {
    const raw = localStorage.getItem(SO_CART_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch (err) {
    return [];
  }
}

function soWriteCart(items) {
  localStorage.setItem(SO_CART_KEY, JSON.stringify(items));
  soUpdateCartBadge();
}

function soCartCount(items) {
  return (items || soReadCart()).reduce((sum, item) => sum + item.qty, 0);
}

function soAddToCart({ id, variant, qty }) {
  const product = window.SO_getProduct(id);
  if (!product) return;
  const quantity = Math.max(1, Number(qty) || 1);
  const items = soReadCart();
  const existing = items.find((item) => item.id === id && item.variant === (variant || ""));
  if (existing) existing.qty += quantity;
  else items.push({ id, variant: variant || "", qty: quantity });
  soWriteCart(items);
}

function soSetQty(id, variant, qty) {
  const items = soReadCart();
  const next = Math.max(0, Number(qty) || 0);
  const match = items.find((item) => item.id === id && item.variant === (variant || ""));
  if (!match) return;
  if (next < 1) soWriteCart(items.filter((item) => item !== match));
  else {
    match.qty = next;
    soWriteCart(items);
  }
}

function soClearCart() {
  soWriteCart([]);
}

function soApiBase() {
  const configured = (window.SO_STRIPE && window.SO_STRIPE.checkoutApiUrl) || "";
  const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (configured) {
    const isLocalhostApi = /localhost|127\.0\.0\.1/i.test(configured);
    if (!isLocalhostApi || local) return configured.replace(/\/$/, "");
  }
  if (location.protocol === "http:" || location.protocol === "https:") return location.origin;
  return "http://localhost:4242";
}

function soCheckoutEndpoint() {
  return soApiBase() + "/create-checkout-session";
}

function soPaymentLinkForItems(items) {
  // Payment Links only support a single SKU here. Never fall back for multi-item carts.
  if (!items || items.length !== 1) return "";
  const links = (window.SO_STRIPE && window.SO_STRIPE.paymentLinks) || {};
  const first = items[0];
  const key = first.variant ? first.id + ":" + first.variant : first.id;
  const href = links[key] || links[first.id] || "";
  if (!href) return "";
  try {
    const url = new URL(href);
    const qty = Math.max(1, Number(first.qty) || 1);
    if (qty > 1) url.searchParams.set("quantity", String(qty));
    return url.toString();
  } catch (err) {
    return href;
  }
}

async function soStartCheckout(items, statusEl) {
  function say(message) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.textContent = message;
  }
  say("Opening checkout…");
  const apiBase = soApiBase();
  const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const useApi = local || /^https:\/\//i.test(apiBase);
  if (useApi) {
    try {
      const res = await fetch(soCheckoutEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
    } catch (err) {
      /* fall through to Payment Links */
    }
  }
  if (items.length === 1) {
    const href = soPaymentLinkForItems(items);
    if (href) {
      window.location.assign(href);
      return;
    }
  } else if (items.length > 1) {
    say("Checkout service unavailable. Multi-item carts need the shop API — please try again.");
    throw new Error("checkout api unavailable for multi-item cart");
  }
  say("Could not open checkout. Please try again.");
  throw new Error("checkout failed");
}

function soUpdateCartBadge() {
  const count = soCartCount();
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(count);
    el.hidden = count < 1;
  });
}

document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-add-to-cart]");
  if (!btn) return;
  event.preventDefault();
  soAddToCart({
    id: btn.getAttribute("data-add-to-cart"),
    variant: btn.getAttribute("data-variant") || "",
    qty: 1
  });
  const original = btn.textContent;
  btn.textContent = "Added";
  window.setTimeout(() => {
    btn.textContent = original;
  }, 1200);
});

document.addEventListener("DOMContentLoaded", soUpdateCartBadge);
window.addEventListener("storage", soUpdateCartBadge);

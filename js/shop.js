function productUrl(id) {
  return "/products/" + encodeURIComponent(id);
}

function webpOf(src) {
  return String(src || "").replace(/\.jpe?g$/i, ".webp");
}

function dimAttrs(src) {
  const map = window.SO_IMAGE_DIMS || {};
  const d = map[src] || map[String(src || "").replace(/^\//, "")];
  if (!d) return "";
  return ` width="${d.w}" height="${d.h}"`;
}

function pictureHtml(src, alt, attrs, opts) {
  const lazy = opts && opts.lazy;
  const webp = webpOf(src);
  const lazyAttr = lazy ? ' loading="lazy" decoding="async"' : "";
  const dims = lazy ? dimAttrs(src) : "";
  const extra = attrs ? " " + attrs : "";
  return `<picture><source type="image/webp" srcset="${webp}"><img src="${src}" alt="${alt || ""}"${dims}${lazyAttr}${extra}></picture>`;
}

function wireStickyBar() {
  const bar = document.getElementById("sticky-buy");
  const actions = document.getElementById("buy-actions");
  if (!bar || !actions) return;
  const mq = window.matchMedia("(max-width: 900px)");
  function sync() {
    if (!mq.matches) {
      bar.hidden = true;
      return;
    }
    const rect = actions.getBoundingClientRect();
    const outOfView = rect.bottom < 0 || rect.top > window.innerHeight;
    bar.hidden = !outOfView;
  }
  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  mq.addEventListener("change", sync);
  sync();
}

function productCard(product) {
  const img = (product.images && product.images[0]) || "images/logo.png";
  const variant = product.variants[0] ? product.variants[0].id : "";
  const variantAttr = variant ? ` data-variant="${variant}"` : "";
  return `<article class="product-card">
    <a href="${productUrl(product.id)}">
      <div class="product-thumb" data-tag="${product.tag}">${pictureHtml(img, product.shortName, "", { lazy: true })}</div>
    </a>
    <div class="product-info">
      <h4><a href="${productUrl(product.id)}">${product.shortName}</a></h4>
      <span>${window.SO_formatPrice(product.price)}</span>
      <button type="button" class="btn btn-ghost add-cart-btn" data-add-to-cart="${product.id}"${variantAttr}>Add to cart</button>
    </div>
  </article>`;
}

function renderShop() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const post = params.get("post");
  const list = window.SO_PRODUCTS.filter((item) => !item.hidden && (!post || item.post === post));
  grid.innerHTML = list.map(productCard).join("") || "<p class='empty-copy'>Nothing posted here yet.</p>";
}

function renderHomeShop() {
  const grid = document.getElementById("home-shop-grid");
  if (!grid) return;
  grid.innerHTML = window.SO_PRODUCTS.filter((item) => !item.hidden).map(productCard).join("");
}

function renderProduct() {
  const root = document.querySelector('#product-root[data-ssr="1"]');
  if (!root) return;
  const match = location.pathname.match(/^\/products\/([^\/]+)\/?$/);
  const product = match && window.SO_getProduct(decodeURIComponent(match[1]));
  if (!product) return;
  const variant = product.variants[0] ? product.variants[0].id : "";

  let selected = variant;
  root.querySelectorAll(".thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".thumb").forEach((el) => el.classList.remove("is-on"));
      btn.classList.add("is-on");
      const hero = document.getElementById("product-hero");
      const src = btn.getAttribute("data-src");
      const webp = btn.getAttribute("data-webp") || webpOf(src);
      if (hero) {
        hero.src = src;
        const source = hero.parentElement && hero.parentElement.querySelector("source[type='image/webp']");
        if (source) source.srcset = webp;
      }
    });
  });
  root.querySelectorAll(".variant").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".variant").forEach((el) => el.classList.remove("is-on"));
      btn.classList.add("is-on");
      selected = btn.getAttribute("data-variant");
    });
  });

  const status = document.getElementById("buy-status");
  function selectedLine() {
    const qty = Number(document.getElementById("qty").value) || 1;
    return { id: product.id, variant: selected, qty };
  }
  ["add-cart", "sticky-add-cart"].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      soAddToCart(selectedLine());
      if (status) {
        status.hidden = false;
        status.textContent = "Added to cart.";
      }
    });
  });
  ["buy-now", "sticky-buy-now"].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await soStartCheckout([selectedLine()], status);
      } catch (err) {
        btn.disabled = false;
      }
    });
  });
  wireStickyBar();
}

function lineLabel(item, product) {
  const variant = (product.variants || []).find((row) => row.id === item.variant);
  return variant ? product.shortName + " · " + variant.name : product.shortName;
}

function renderCart() {
  const root = document.getElementById("cart-root");
  if (!root) return;
  const items = soReadCart();
  if (!items.length) {
    const recs = (window.SO_PRODUCTS || [])
      .filter((p) => p && !p.hidden && (p.id === "diamondback-10x50-killflash" || p.id === "holosun-hs510c-killflash"))
      .map(productCard)
      .join("");
    root.innerHTML = `<p class="empty-copy">Cart is empty.</p>
      <p><a class="btn btn-primary" href="shop.html">Shop parts</a></p>
      <div class="empty-recs">
        <h2>Recommended</h2>
        <div class="shop-grid">${recs}</div>
      </div>`;
    return;
  }
  let total = 0;
  const rows = items.map((item) => {
    const product = window.SO_getProduct(item.id);
    if (!product) return "";
    total += product.price * item.qty;
    return `<div class="cart-row">
      <img src="${product.images[0]}" alt="">
      <div>
        <h3>${lineLabel(item, product)}</h3>
        <p>${window.SO_formatPrice(product.price)}</p>
        <label>Qty <input type="number" min="0" max="20" value="${item.qty}" data-id="${item.id}" data-variant="${item.variant || ""}"></label>
      </div>
    </div>`;
  }).join("");
  root.innerHTML = `
    ${rows}
    <div class="cart-total">
      <span>Subtotal</span>
      <strong>${window.SO_formatPrice(total)}</strong>
    </div>
    <p class="ship-note">Secure checkout. Free US shipping. You will confirm payment on the next screen.</p>
    <button type="button" class="btn btn-primary" id="checkout-btn">Continue to checkout</button>
    <p class="form-status" id="checkout-status" hidden></p>
  `;
  root.querySelectorAll("input[type=number]").forEach((input) => {
    input.addEventListener("change", () => {
      soSetQty(input.getAttribute("data-id"), input.getAttribute("data-variant"), input.value);
      renderCart();
    });
  });
  const checkoutBtn = document.getElementById("checkout-btn");
  const checkoutStatus = document.getElementById("checkout-status");
  checkoutBtn.addEventListener("click", async () => {
    checkoutBtn.disabled = true;
    try {
      await soStartCheckout(soReadCart(), checkoutStatus);
    } catch (err) {
      checkoutBtn.disabled = false;
    }
  });
}

function bootShop() {
  try {
    renderShop();
    renderHomeShop();
    renderProduct();
    renderCart();
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  } catch (err) {
    console.error(err);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootShop);
else bootShop();

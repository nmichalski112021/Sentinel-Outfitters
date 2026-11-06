

function strongLead(text) {
  const raw = String(text ?? "");
  const idx = raw.indexOf(". ");
  if (idx < 0) return raw;
  return `<strong>${raw.slice(0, idx + 1)}</strong> ${raw.slice(idx + 2)}`;
}

function renderCompareHtml(product) {
  if (!product || !product.compareTitle) return "";
  const points = Array.isArray(product.comparePoints) ? product.comparePoints : [];
  const items = points.map((point) => `<li>${strongLead(point)}</li>`).join("");
  const close = product.compareClose
    ? `<p class="copy">${strongLead(product.compareClose)} For the shared fit table across our housings, see the <a href="/glare-guide.html#fit-guide">optic glare fit guide</a>.</p>`
    : "";
  return `<div class="product-compare" id="choose-hs510c-killflash">
  <h2>${product.compareTitle}</h2>
  <p class="copy">${product.compareLead || ""}</p>
  <ul class="spec-list">${items}</ul>
  ${close}
</div>`;
}

function relatedProductsHtml(product) {
  if (!window.SO_PRODUCTS || !product || !product.tag) return "";
  const links = window.SO_PRODUCTS
    .filter((p) => p && p.id && !p.hidden && p.id !== product.id && p.tag === product.tag)
    .slice(0, 4)
    .map((p) => `<li><a href="${productUrl(p.id)}">${p.shortName}</a> — ${p.tag}</li>`)
    .join("");
  if (!links) return "";
  return `<div class="related-skus"><p class="copy"><strong>Also see.</strong></p><ul>${links}</ul></div>`;
}

function faqHtml(product) {
  const items = Array.isArray(product.faq) ? product.faq : [];
  if (!items.length) return "";
  return `<section class="product-faq"><div class="wrap"><h2>FAQ</h2>${items
    .map((item) => `<div class="faq-item"><h3>${item.q}</h3><p class="copy">${item.a}</p></div>`)
    .join("")}</div></section>`;
}


function starsHtml(rating) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return `<span class="review-stars" aria-label="${n} out of 5 stars">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>`;
}

function reviewsHtml(product) {
  const items = Array.isArray(product.reviews) ? product.reviews : [];
  if (!items.length) return "";
  const cards = items
    .map((item) => {
      const sourceUrl = item.sourceUrl || "https://www.etsy.com/shop/SentinelOutfitters";
      const source = item.source || "Etsy";
      return `<blockquote class="review-card">
        <div class="review-meta">${starsHtml(item.rating)} <span class="review-by">${item.name}</span> <span class="review-date">${item.date || ""}</span> <span class="review-via">via <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${source}</a></span></div>
        <p class="review-quote">${item.quote}</p>
      </blockquote>`;
    })
    .join("");
  return `<section class="product-reviews"><div class="wrap"><h2>Reviews</h2>${cards}</div></section>`;
}

function productUrl(id) {
  return "/products/" + encodeURIComponent(id);
}

function productIdFromLocation() {
  const pathMatch = location.pathname.match(/^\/products\/([^\/]+)\/?$/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);
  return new URLSearchParams(location.search).get("id");
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

function trustChipsHtml() {
  return `<ul class="trust-chips" aria-label="Purchase details">
    <li>Free US shipping</li>
    <li>Ships in 1–2 business days</li>
    <li><a href="/returns">Easy returns</a></li>
    <li>Printed in Gulfport, MS</li>
  </ul>`;
}

function etsyProofHtml(product) {
  const items = Array.isArray(product.reviews) ? product.reviews : [];
  if (items.length) return "";
  if (!product.etsyShopRating) return "";
  const countBit = product.etsyShopReviewCount
    ? ` from ${product.etsyShopReviewCount} shop reviews`
    : "";
  return `<p class="etsy-proof"><span class="review-stars" aria-hidden="true">★★★★★</span> <a href="https://www.etsy.com/shop/SentinelOutfitters" target="_blank" rel="noopener noreferrer">${product.etsyShopRating}-star rated on Etsy</a>${countBit}.</p>`;
}

function wireStickyBuy(product, getSelected, status) {
  const bar = document.getElementById("sticky-buy");
  const actions = document.getElementById("buy-actions");
  if (!bar || !actions) return;
  const stickyAdd = document.getElementById("sticky-add-cart");
  const stickyBuy = document.getElementById("sticky-buy-now");
  if (stickyAdd) {
    stickyAdd.addEventListener("click", () => {
      const qty = Number(document.getElementById("qty").value) || 1;
      soAddToCart({ id: product.id, variant: getSelected(), qty });
      if (status) {
        status.hidden = false;
        status.textContent = "Added to cart.";
      }
    });
  }
  if (stickyBuy) {
    stickyBuy.addEventListener("click", async () => {
      const qty = Number(document.getElementById("qty").value) || 1;
      stickyBuy.disabled = true;
      try {
        await soStartCheckout([{ id: product.id, variant: getSelected(), qty }], status);
      } catch (err) {
        stickyBuy.disabled = false;
      }
    });
  }
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
  const root = document.getElementById("product-root");
  if (!root) return;
  const id = productIdFromLocation();
  if (!id) return;
  // Old query URLs → clean path (server also 301s).
  if (/\/product\.html$/i.test(location.pathname) && new URLSearchParams(location.search).get("id")) {
    location.replace(productUrl(id));
    return;
  }
  const product = window.SO_getProduct(id);
  if (!product) {
    root.innerHTML = `<section class="page-hero"><div class="wrap"><div class="eyebrow">Shop</div><h1>That SKU isn’t posted.</h1><p><a class="btn btn-primary" href="shop.html">Back to shop</a></p></div></section>`;
    return;
  }
  const ssr = root.getAttribute("data-ssr") === "1";
  const variant = product.variants[0] ? product.variants[0].id : "";
  if (!ssr) {
  document.title = product.seoTitle || (product.shortName + " — Sentinel Outfitters");
  const description = product.seoDescription || product.lead;
  const canonicalUrl = "https://sentinel-outfitters.com" + productUrl(product.id);
  let descriptionMeta = document.head.querySelector("meta[name=description]");
  if (!descriptionMeta) {
    descriptionMeta = document.createElement("meta");
    descriptionMeta.name = "description";
    document.head.appendChild(descriptionMeta);
  }
  descriptionMeta.content = description;
  let canonical = document.head.querySelector("link[rel=canonical]");
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;
  root.innerHTML = `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${product.postLabel} · ${product.tag}</div>
        <h1>
          <span class="h1-full">${product.buyerQuestion || product.name}</span>
          <span class="h1-short">${product.shortName}</span>
        </h1>
        ${product.buyerQuestion ? `<h2 class="product-subtitle">${product.name}</h2>` : ""}
        <p>${product.lead}</p>
      </div>
    </section>
    <section>
      <div class="wrap product-layout">
        <div class="gallery">
          ${pictureHtml(product.images[0] || "images/logo.png", product.shortName, 'id="product-hero"')}
          ${product.images.length < 2 ? "" : `<div class="thumbs">${product.images.map((src, i) => `<button type="button" class="thumb${i === 0 ? " is-on" : ""}" data-src="${src}" data-webp="${webpOf(src)}">${pictureHtml(src, "", "", { lazy: true })}</button>`).join("")}</div>`}
        </div>
        <div class="buy-box">
          <p class="price">${window.SO_formatPrice(product.price)}</p>
          ${trustChipsHtml()}
          ${etsyProofHtml(product)}
          <p class="ship-note">${product.shipping}</p>
          ${product.variants.length ? `<div class="variant-label">Color</div><div class="variants" id="variants">${product.variants.map((item, i) => `<button type="button" class="variant${i === 0 ? " is-on" : ""}" data-variant="${item.id}">${item.name}</button>`).join("")}</div>` : ""}
          <label class="qty-label" for="qty">Qty</label>
          <input id="qty" class="qty" type="number" min="1" max="20" value="1">
          <div class="buy-actions" id="buy-actions">
            <button type="button" class="btn btn-ghost" id="add-cart">Add to cart</button>
            <button type="button" class="btn btn-primary" id="buy-now">Continue to checkout</button>
          </div>
          <p class="form-status" id="buy-status" hidden></p>
          <ul class="spec-list">${product.bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
          ${product.description.map((p) => `<p class="copy">${p}</p>`).join("")}
          ${product.brandNote ? `<p class="copy brand-note">${product.brandNote}</p>` : ""}
          <p class="copy"><strong>Fit.</strong> ${product.fit}</p>
          ${renderCompareHtml(product)}
          ${relatedProductsHtml(product)}
          ${product.tag === "Killflash" ? `<p class="copy">See the full <a href="/killflash.html">killflash ARD lineup</a> if you need a different housing. Not sure which housing or mount style fits? Check the <a href="/glare-guide.html#fit-guide">optic glare fit guide</a>.</p>` : ""}
        </div>
      </div>
    </section>
    ${reviewsHtml(product)}
    ${faqHtml(product)}
    <div class="sticky-buy" id="sticky-buy" hidden>
      <span class="sticky-buy-price">${window.SO_formatPrice(product.price)}</span>
      <button type="button" class="btn btn-ghost" id="sticky-add-cart">Add to cart</button>
      <button type="button" class="btn btn-primary" id="sticky-buy-now">Checkout</button>
    </div>`;
  }

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
  const addBtn = document.getElementById("add-cart");
  const buyBtn = document.getElementById("buy-now");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const qty = Number(document.getElementById("qty").value) || 1;
      soAddToCart({ id: product.id, variant: selected, qty });
      if (status) {
        status.hidden = false;
        status.textContent = "Added to cart.";
      }
    });
  }
  if (buyBtn) {
    buyBtn.addEventListener("click", async () => {
      const qty = Number(document.getElementById("qty").value) || 1;
      buyBtn.disabled = true;
      try {
        await soStartCheckout([{ id: product.id, variant: selected, qty }], status);
      } catch (err) {
        buyBtn.disabled = false;
      }
    });
  }
  wireStickyBuy(product, () => selected, status);
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

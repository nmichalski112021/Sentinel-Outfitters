import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPrice(cents) {
  return "$" + (Number(cents) / 100).toFixed(2);
}

function productPath(id) {
  return "/products/" + encodeURIComponent(id);
}

function renderProductBody(product) {
  const title = product.buyerQuestion || product.name;
  const subtitle = product.buyerQuestion
    ? `<h2 class="product-subtitle">${escapeHtml(product.name)}</h2>`
    : "";
  const hero = product.images && product.images[0] ? product.images[0] : "images/logo.jpg";
  const thumbs =
    product.photosComingSoon || !product.images || product.images.length < 2
      ? ""
      : `<div class="thumbs">${product.images
          .map(
            (src, i) =>
              `<button type="button" class="thumb${i === 0 ? " is-on" : ""}" data-src="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt=""></button>`
          )
          .join("")}</div>`;
  const variants =
    product.variants && product.variants.length
      ? `<div class="variant-label">Color</div><div class="variants" id="variants">${product.variants
          .map(
            (item, i) =>
              `<button type="button" class="variant${i === 0 ? " is-on" : ""}" data-variant="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>`
          )
          .join("")}</div>`
      : "";
  const bullets = (product.bullets || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const description = (product.description || [])
    .map((p) => `<p class="copy">${escapeHtml(p)}</p>`)
    .join("");
  const brandNote = product.brandNote
    ? `<p class="copy"><strong>Brand note.</strong> ${escapeHtml(product.brandNote)}</p>`
    : "";
  const photosNote = product.photosComingSoon
    ? `<p class="photos-note">Photos coming soon. Printed and shipping.</p>`
    : "";

  return `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${escapeHtml(product.postLabel)} · ${escapeHtml(product.tag)}</div>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle}
        <p>${escapeHtml(product.lead)}</p>
      </div>
    </section>
    <section>
      <div class="wrap product-layout">
        <div class="gallery">
          <img id="product-hero" src="${escapeHtml(hero)}" alt="${escapeHtml(product.shortName)}">
          ${thumbs}
        </div>
        <div class="buy-box">
          <p class="price">${escapeHtml(formatPrice(product.price))}</p>
          <p class="ship-note">${escapeHtml(product.shipping || "")}</p>
          ${photosNote}
          ${variants}
          <label class="qty-label" for="qty">Qty</label>
          <input id="qty" class="qty" type="number" min="1" max="20" value="1">
          <div class="buy-actions">
            <button type="button" class="btn btn-ghost" id="add-cart">Add to cart</button>
            <button type="button" class="btn btn-primary" id="buy-now">Continue to checkout</button>
          </div>
          <p class="form-status" id="buy-status" hidden></p>
          <ul class="spec-list">${bullets}</ul>
          ${description}
          ${brandNote}
          <p class="copy"><strong>Fit.</strong> ${escapeHtml(product.fit || "")}</p>
        </div>
      </div>
    </section>`;
}

export function renderProductPage(rootDir, product) {
  const template = readFileSync(resolve(rootDir, "product.html"), "utf8");
  const seoTitle = product.seoTitle || `${product.shortName} — Sentinel Outfitters`;
  const seoDescription = product.seoDescription || product.lead || "";
  const canonicalUrl = "https://sentinel-outfitters.com" + productPath(product.id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: seoDescription,
    brand: { "@type": "Organization", name: "Sentinel Outfitters" },
    image: (product.images || []).map((src) =>
      src.startsWith("http") ? src : "https://sentinel-outfitters.com/" + src.replace(/^\//, "")
    ),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price / 100,
      availability: "https://schema.org/InStock",
      url: canonicalUrl
    }
  };

  let html = template;
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(seoTitle)}</title>`
  );
  html = html.replace(
    /<meta name="description" content="[^"]*">/i,
    `<meta name="description" content="${escapeHtml(seoDescription)}">`
  );
  // Insert canonical + JSON-LD before </head>
  const headExtras = `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <script id="product-jsonld" type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
`;
  if (!/rel="canonical"/i.test(html)) {
    html = html.replace(/<\/head>/i, headExtras + "</head>");
  }
  // Replace product-root contents with SSR body (shop.js still hydrates/replaces for interactivity)
  html = html.replace(
    /<div id="product-root">[\s\S]*?<\/div>\s*<\/main>/i,
    `<div id="product-root" data-ssr="1">${renderProductBody(product)}</div>
  </main>`
  );
  return html;
}

export function renderProductNotFound(rootDir) {
  const template = readFileSync(resolve(rootDir, "product.html"), "utf8");
  const body = `<section class="page-hero"><div class="wrap"><div class="eyebrow">Shop</div><h1>That SKU isn’t posted.</h1><p><a class="btn btn-primary" href="shop.html">Back to shop</a></p></div></section>`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, "<title>Product not found — Sentinel Outfitters</title>")
    .replace(
      /<div id="product-root">[\s\S]*?<\/div>\s*<\/main>/i,
      `<div id="product-root">${body}</div>
  </main>`
    );
}

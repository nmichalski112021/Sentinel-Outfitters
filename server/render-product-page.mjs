import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadProducts } from "./load-products.mjs";

function escapeHtml(value) {
  const map = {
    "&": String.fromCharCode(38) + "amp;",
    "<": String.fromCharCode(38) + "lt;",
    ">": String.fromCharCode(38) + "gt;",
    '"': String.fromCharCode(38) + "quot;",
    "'": String.fromCharCode(38) + "#39;"
  };
  return String(value ?? "").replace(/[&<>"']/g, (ch) => map[ch]);
}

function renderFaqHtml(product) {
  const items = Array.isArray(product.faq) ? product.faq : [];
  if (!items.length) return "";
  const rows = items
    .map(
      (item) =>
        `<div class="faq-item"><h3>${escapeHtml(item.q)}</h3><p class="copy">${escapeHtml(item.a)}</p></div>`
    )
    .join("");
  return `<section class="product-faq"><div class="wrap"><h2>FAQ</h2>${rows}</div></section>`;
}

function renderReviewsHtml(product) {
  const items = Array.isArray(product.reviews) ? product.reviews : [];
  if (!items.length) return "";
  const cards = items
    .map((item) => {
      const n = Math.max(0, Math.min(5, Number(item.rating) || 0));
      const stars = "\u2605".repeat(n) + "\u2606".repeat(5 - n);
      const sourceUrl = item.sourceUrl || "https://www.etsy.com/shop/SentinelOutfitters";
      const source = item.source || "Etsy";
      return `<blockquote class="review-card">
        <div class="review-meta"><span class="review-stars" aria-label="${n} out of 5 stars">${stars}</span> <span class="review-by">${escapeHtml(item.name)}</span> <span class="review-date">${escapeHtml(item.date || "")}</span> <span class="review-via">via <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source)}</a></span></div>
        <p class="review-quote">${escapeHtml(item.quote)}</p>
      </blockquote>`;
    })
    .join("");
  return `<section class="product-reviews"><div class="wrap"><h2>Reviews</h2>${cards}</div></section>`;
}

function faqJsonLd(product) {
  const items = Array.isArray(product.faq) ? product.faq : [];
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  };
}

function formatPrice(cents) {
  return "$" + (Number(cents) / 100).toFixed(2);
}

function productPath(id) {
  return "/products/" + encodeURIComponent(id);
}

function merchantReturnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "US",
    returnPolicyCountry: "US",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
    refundType: "https://schema.org/FullRefund",
    merchantReturnLink: "https://sentinel-outfitters.com/shipping.html"
  };
}

function shippingDetails() {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 8, unitCode: "DAY" }
    }
  };
}


function relatedProductsHtml(product, allProducts) {
  const tag = product && product.tag;
  if (!tag) return "";
  const others = (allProducts || [])
    .filter((p) => p && p.id && p.id !== product.id && p.tag === tag)
    .slice(0, 4);
  if (!others.length) return "";
  const links = others
    .map(
      (p) =>
        `<li><a href="${productPath(p.id)}">${escapeHtml(p.shortName)}</a> \u2014 ${escapeHtml(p.tag)}</li>`
    )
    .join("");
  return `<div class="related-skus"><p class="copy"><strong>Also see.</strong></p><ul>${links}</ul></div>`;
}

function renderProductBody(product, allProducts) {
  const title = product.name;
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
        <div class="eyebrow">${escapeHtml(product.postLabel)} \u00b7 ${escapeHtml(product.tag)}</div>
        <h1>${escapeHtml(title)}</h1>
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
          ${relatedProductsHtml(product, allProducts)}
          ${product.tag === "Killflash" ? `<p class="copy">See the full <a href="/killflash.html">killflash ARD lineup</a> if you need a different housing.</p>` : ""}
        </div>
      </div>
    </section>
    ${renderReviewsHtml(product)}
    ${renderFaqHtml(product)}`;
}

export function renderProductPage(rootDir, product) {
  const template = readFileSync(resolve(rootDir, "product.html"), "utf8");
  const seoTitle = product.seoTitle || `${product.shortName} - Sentinel Outfitters`;
  const seoDescription = product.seoDescription || product.lead || "";
  const canonicalUrl = "https://sentinel-outfitters.com" + productPath(product.id);
  const images = (product.images || []).map((src) =>
    src.startsWith("http") ? src : "https://sentinel-outfitters.com/" + src.replace(/^\//, "")
  );
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const ratings = reviews.map((item) => Number(item.rating) || 0).filter((n) => n > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: seoDescription,
    sku: product.id,
    mpn: product.id,
    brand: {
      "@type": "Brand",
      name: "Sentinel Outfitters",
      url: "https://sentinel-outfitters.com/"
    },
    image: images.length ? images : ["https://sentinel-outfitters.com/images/logo.jpg"],
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: canonicalUrl,
      seller: {
        "@type": "Organization",
        name: "Sentinel Outfitters LLC",
        url: "https://sentinel-outfitters.com/"
      },
      shippingDetails: shippingDetails(),
      hasMerchantReturnPolicy: merchantReturnPolicy()
    }
  };
  if (ratings.length) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (ratings.reduce((sum, n) => sum + n, 0) / ratings.length).toFixed(1),
      reviewCount: String(ratings.length),
      bestRating: "5",
      worstRating: "1"
    };
    jsonLd.review = reviews.map((item) => ({
      "@type": "Review",
      author: { "@type": "Person", name: item.name },
      datePublished: item.date || undefined,
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(item.rating),
        bestRating: "5"
      },
      reviewBody: item.quote
    }));
  }

  let html = template;
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(seoTitle)}</title>`
  );
  html = html.replace(
    /<meta name="description" content="[^"]*">/i,
    `<meta name="description" content="${escapeHtml(seoDescription)}">`
  );
  const ogImage = images[0] || "https://sentinel-outfitters.com/images/logo.jpg";
  const headExtras = `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(seoTitle)}">
  <meta property="og:description" content="${escapeHtml(seoDescription)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <script id="product-jsonld" type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
`;
  if (!/rel="canonical"/i.test(html)) {
    html = html.replace(/<\/head>/i, headExtras + "</head>");
  }
  const faqLd = faqJsonLd(product);
  if (faqLd) {
    const faqScript = `  <script id="product-faq-jsonld" type="application/ld+json">${JSON.stringify(faqLd).replace(/</g, "\\u003c")}</script>\n`;
    html = html.replace(/<\/head>/i, faqScript + "</head>");
  }
  html = html.replace(
    /<div id="product-root">[\s\S]*?<\/div>\s*<\/main>/i,
    `<div id="product-root" data-ssr="1">${renderProductBody(product, loadProducts(rootDir))}</div>
  </main>`
  );
  return html;
}

export function renderProductNotFound(rootDir) {
  const template = readFileSync(resolve(rootDir, "product.html"), "utf8");
  const body = `<section class="page-hero"><div class="wrap"><div class="eyebrow">Shop</div><h1>That SKU is not posted.</h1><p><a class="btn btn-primary" href="shop.html">Back to shop</a></p></div></section>`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, "<title>Product not found - Sentinel Outfitters</title>")
    .replace(
      /<div id="product-root">[\s\S]*?<\/div>\s*<\/main>/i,
      `<div id="product-root">${body}</div>
  </main>`
    );
}

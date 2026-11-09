import { readFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import Stripe from "stripe";
import { lineItemFromCart } from "./catalog.mjs";
import { getProductById, loadProducts } from "./load-products.mjs";
import {
  renderProductPage,
  renderProductNotFound,
  renderProductUnavailable,
  PRODUCT_UNAVAILABLE_FALLBACK_HTML
} from "./render-product-page.mjs";
import { applySiteChrome, readPage } from "./site-chrome.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  try {
    const text = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    // optional local .env
  }
}

loadEnv();

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret || (!secret.startsWith("sk_") && !secret.startsWith("rk_"))) {
  console.error("Set STRIPE_SECRET_KEY in .env to sk_live_/sk_test_ or a restricted rk_ key");
  process.exit(1);
}

const stripe = new Stripe(secret);
const port = Number(process.env.PORT) || 4242;
const siteUrl = (
  process.env.SITE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "http://localhost:" + port
).replace(/\/$/, "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Keep order records outside the public static tree. On Render without a
// persistent disk this still only lasts until redeploy — set ORDERS_PATH to a
// mounted disk path for durable fulfillment.
const ordersFile = resolve(
  process.env.ORDERS_PATH || resolve(root, "data", "orders.jsonl")
);
mkdirSync(dirname(ordersFile), { recursive: true });

const fulfilledSessions = new Set();

function loadFulfilledSessions() {
  if (!existsSync(ordersFile)) return;
  try {
    const text = readFileSync(ordersFile, "utf8");
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line);
        if (row.sessionId) fulfilledSessions.add(row.sessionId);
        if (row.eventId) fulfilledSessions.add("event:" + row.eventId);
      } catch {
        // skip corrupt lines
      }
    }
  } catch (err) {
    console.error("Could not load existing orders log:", err.message);
  }
}

loadFulfilledSessions();

function integrationId() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let suffix = "";
  for (let i = 0; i < 8; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return "sentinel-web-" + suffix;
}

function blockPrivatePaths(req, res, next) {
  const path = req.path.toLowerCase();
  if (
    path === "/.git" ||
    path.startsWith("/.git/") ||
    path === "/data" ||
    path.startsWith("/data/") ||
    path === "/server" ||
    path.startsWith("/server/") ||
    path === "/scripts" ||
    path.startsWith("/scripts/") ||
    path === "/docs" ||
    path.startsWith("/docs/") ||
    path === "/partials" ||
    path.startsWith("/partials/") ||
    path === "/.env" ||
    path.startsWith("/.env.") ||
    path === "/package.json" ||
    path === "/package-lock.json" ||
    path === "/render.yaml" ||
    path === "/readme.md" ||
    path === "/skills-lock.json" ||
    path.startsWith("/node_modules/")
  ) {
    return res.status(404).end();
  }
  next();
}

async function buildOrderRecord(session, eventId) {
  let lineItems = [];
  try {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price.product"]
    });
    const items = (full.line_items && full.line_items.data) || [];
    lineItems = items.map((li) => {
      const product =
        li.price && li.price.product && typeof li.price.product === "object"
          ? li.price.product
          : null;
      const meta = (product && product.metadata) || {};
      return {
        quantity: li.quantity,
        amountSubtotal: li.amount_subtotal,
        amountTotal: li.amount_total,
        currency: li.currency,
        description: li.description,
        sku: meta.sku || null,
        variant: meta.variant || null
      };
    });
  } catch (err) {
    console.error("Could not expand line items for", session.id, err.message);
  }

  return {
    at: new Date().toISOString(),
    eventId: eventId || null,
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency,
    customerEmail: session.customer_details && session.customer_details.email,
    customerName: session.customer_details && session.customer_details.name,
    shipping: session.shipping_details || null,
    metadata: session.metadata || {},
    lineItems
  };
}

async function fulfillOrder(session, eventId) {
  if (fulfilledSessions.has(session.id)) {
    console.log("Skip duplicate fulfill for session", session.id);
    return;
  }
  if (eventId && fulfilledSessions.has("event:" + eventId)) {
    console.log("Skip duplicate fulfill for event", eventId);
    return;
  }

  const record = await buildOrderRecord(session, eventId);
  appendFileSync(ordersFile, JSON.stringify(record) + "\n");
  fulfilledSessions.add(session.id);
  if (eventId) fulfilledSessions.add("event:" + eventId);
  console.log("Fulfilled checkout session", session.id, session.payment_status);
}

const app = express();


function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
  );
  // HSTS only helps on HTTPS (Render/live); harmless on local http.
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Allow self + Google Fonts + Stripe Checkout redirects/Payment Links + own API.
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data:",
      "connect-src 'self'",
      "form-action 'self' https://formsubmit.co",
      "upgrade-insecure-requests"
    ].join("; ")
  );
  next();
}

app.use(securityHeaders);

// One canonical host: www.sentinel-outfitters.com -> apex, path + query kept.
// GET/HEAD get a 301; other methods get a 308 so the method and body survive.
// Health checks and the Stripe/API endpoints are served directly on www so a
// webhook or checkout call that still targets www never depends on a redirect.
const WWW_HOST = "www.sentinel-outfitters.com";
const WWW_REDIRECT_EXEMPT = new Set([
  "/healthz",
  "/webhook",
  "/webhook-self-test",
  "/create-checkout-session",
  "/session-status"
]);
app.use((req, res, next) => {
  const host = String(req.get("host") || "").split(":")[0].toLowerCase();
  if (host !== WWW_HOST || WWW_REDIRECT_EXEMPT.has(req.path)) return next();
  const status = req.method === "GET" || req.method === "HEAD" ? 301 : 308;
  return res.redirect(status, "https://sentinel-outfitters.com" + req.originalUrl);
});

// Keep the Render service URL out of search results and make the custom domain canonical.
// Skip Stripe/API POST endpoints — a 301 drops the body and breaks webhook signature verify.
app.use((req, res, next) => {
  const host = String(req.get("host") || "").split(":")[0].toLowerCase();
  if (host === "sentinel-outfitters.onrender.com" || host.endsWith(".onrender.com")) {
    const path = String(req.path || "");
    const skip =
      path === "/webhook" ||
      path === "/webhook-self-test" ||
      path === "/create-checkout-session" ||
      path === "/session-status" ||
      path === "/healthz";
    if (!skip) {
      return res.redirect(301, "https://sentinel-outfitters.com" + req.url);
    }
  }
  next();
});

// Belt-and-braces http -> https for the custom domain. Render's edge already
// 301s plain HTTP; this covers any proxy (e.g. Cloudflare orange-cloud with
// "Flexible" SSL) that forwards http requests to the app.
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.path === "/healthz") return next();
  const host = String(req.get("host") || "").split(":")[0].toLowerCase();
  const proto = String(req.get("x-forwarded-proto") || "").split(",")[0].trim().toLowerCase();
  if (proto === "http" && (host === "sentinel-outfitters.com" || host === "www.sentinel-outfitters.com")) {
    return res.redirect(301, "https://" + host + req.originalUrl);
  }
  next();
});

app.use(blockPrivatePaths);

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!webhookSecret) {
    console.error(
      "STRIPE_WEBHOOK_SECRET is not set. Run: stripe listen --forward-to localhost:" +
        port +
        "/webhook"
    );
    return res.status(500).send("Webhook secret missing");
  }
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch {
    console.error("Webhook signature failed");
    return res.status(400).send("Webhook signature failed");
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") {
        await fulfillOrder(session, event.id);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler failed:", err.message);
    res.status(500).json({ error: "fulfillment failed" });
  }
});

app.post("/webhook-self-test", express.json(), async (req, res) => {
  const token = process.env.WEBHOOK_SELF_TEST_TOKEN;
  if (!token || req.get("x-webhook-self-test") !== token) return res.status(404).end();
  if (!webhookSecret) return res.status(500).json({ error: "webhook secret missing" });
  const payload = JSON.stringify({
    id: "evt_self_test",
    object: "event",
    api_version: "2026-08-26.dahlia",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_self_test",
        object: "checkout.session",
        payment_status: "paid",
        status: "complete",
        amount_total: 0,
        currency: "usd",
        customer_details: { email: "webhook-self-test@example.com" },
        metadata: { sku_list: "webhook-self-test" }
      }
    }
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
  try {
    const result = await fetch("http://127.0.0.1:" + port + "/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": header
      },
      body: payload
    });
    const body = await result.text();
    res.status(result.status).type("text/plain").send(body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.json());

// Prefer NO trailing slash on clean paths (except "/").
// Must check path.endsWith("/") — Express non-strict routing would make
// app.get("/products/:id/") also match the non-slash URL and 301 to itself.
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const path = req.path;
  if (path.length > 1 && path.endsWith("/")) {
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(301, "https://sentinel-outfitters.com" + path.slice(0, -1) + qs);
  }
  next();
});


// Health check for Render zero-downtime deploys (keeps 5xx / fallback robots.txt away from Googlebot).
app.get("/healthz", (req, res) => res.status(200).type("text/plain").send("ok"));

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /cart.html
Disallow: /success.html
Disallow: /product.html

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://sentinel-outfitters.com/sitemap.xml
`);
});

app.get("/sitemap.xml", (req, res) => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const pages = [
    ["https://sentinel-outfitters.com/", "1.0"],
    ["https://sentinel-outfitters.com/killflash.html", "0.95"],
    ["https://sentinel-outfitters.com/glare-guide.html", "0.85"],
    ["https://sentinel-outfitters.com/shop.html", "0.9"],
    ["https://sentinel-outfitters.com/about.html", "0.7"],
    ["https://sentinel-outfitters.com/contact.html", "0.5"],
    ["https://sentinel-outfitters.com/shipping.html", "0.4"],
    ["https://sentinel-outfitters.com/returns", "0.4"],
    ["https://sentinel-outfitters.com/privacy", "0.3"],
    ["https://sentinel-outfitters.com/terms", "0.3"],
    ...loadProducts(root).filter((item) => !item.hidden).map((item) => [
      "https://sentinel-outfitters.com/products/" + encodeURIComponent(item.id),
      "0.9"
    ])
  ];
  const body = pages
    .map(
      ([loc, priority]) =>
        `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`
    )
    .join("\n");
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
});

app.get("/llms.txt", (req, res) => {
  const lines = loadProducts(root)
    .filter((item) => !item.hidden)
    .map((item) => `- ${item.name}: https://sentinel-outfitters.com/products/${encodeURIComponent(item.id)}`)
    .join("\n");
  res.type("text/plain").send(`# Sentinel Outfitters

> Small-batch 3D-printed field gear from Sentinel Outfitters LLC in Gulfport, Mississippi.

- Home: https://sentinel-outfitters.com/
- Shop: https://sentinel-outfitters.com/shop.html
- Killflash: https://sentinel-outfitters.com/killflash.html
- Glare guide: https://sentinel-outfitters.com/glare-guide.html
- About: https://sentinel-outfitters.com/about.html
- Shipping: https://sentinel-outfitters.com/shipping.html
- Returns: https://sentinel-outfitters.com/returns
- Privacy: https://sentinel-outfitters.com/privacy
- Terms: https://sentinel-outfitters.com/terms
- Contact: https://sentinel-outfitters.com/contact.html

## Products
${lines}
`);
});

app.get("/index.html", (req, res) => {
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  return res.redirect(301, "/" + qs);
});

const shopVariants = {
  "": {
    title: "Shop Killflash ARDs & Field Gear — Sentinel Outfitters",
    description:
      "Sentinel Outfitters killflash ARDs for binoculars and red dots, plus EDC field gear. 3D printed in Gulfport, MS. Free US shipping.",
    canonical: "https://sentinel-outfitters.com/shop.html"
  },
  parts: {
    title: "Killflash ARDs for Optics — Sentinel Outfitters",
    description:
      "Sentinel Outfitters honeycomb killflash ARDs made to fit the Vortex Diamondback 10x50 binocular and the Holosun HS510C. 3D printed in Gulfport, MS. Not affiliated with or endorsed by Vortex Optics or Holosun.",
    canonical: "https://sentinel-outfitters.com/shop.html?post=parts",
    h1: "Killflash ARDs.",
    lead: "Honeycomb anti-reflection devices for binoculars and red dots. 3D printed in Gulfport, MS."
  },
  field: {
    title: "Field Accessories & EDC — Sentinel Outfitters",
    description:
      "Everyday-carry field accessories from Sentinel Outfitters, starting with the keychain pill holder 2-pack. Printed in Gulfport, MS. Free US shipping.",
    canonical: "https://sentinel-outfitters.com/shop.html?post=field",
    h1: "Field accessories.",
    lead: "EDC that stays on you — starting with the keychain pill holder. More posts as they earn a SKU."
  }
};

app.get("/shop.html", (req, res) => {
  const post = String((req.query && req.query.post) || "");
  if (post && !Object.prototype.hasOwnProperty.call(shopVariants, post)) {
    return res.redirect(301, "https://sentinel-outfitters.com/shop.html");
  }
  const variant = shopVariants[post] || shopVariants[""];
  let html = readPage(root, "shop.html");
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${variant.title}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/i,
    `<meta name="description" content="${variant.description.replace(/"/g, "&quot;")}">`
  );
  html = html.replace(/\n?\s*<link rel="canonical"[^>]*>/i, "");
  html = html.replace(
    "</head>",
    `  <link rel="canonical" href="${variant.canonical}">\n</head>`
  );
  // Swap hero copy by structure (first <h1> in .page-hero and the <p> right after it),
  // not exact wording, so shop.html copy edits don't silently break variants.
  // The lead's trailing link (e.g. "Compare killflash SKUs") is kept from shop.html.
  // Default page ("") has no h1/lead: its body copy comes straight from shop.html.
  if (variant.h1 && variant.lead) {
    html = html.replace(
      /(<section class="page-hero">[\s\S]*?<h1[^>]*>)[\s\S]*?(<\/h1>\s*<p[^>]*>)([\s\S]*?)(<\/p>)/,
      (_, h1Open, mid, lead, pClose) => {
        const link = (lead.match(/\s*<a\b[^>]*>[\s\S]*?<\/a>[^<]*$/) || [""])[0];
        return `${h1Open}${variant.h1}${mid}${variant.lead}${link}${pClose}`;
      }
    );
  }
  res.type("html").send(html);
});

// Clean product URLs for all current + future SKUs: /products/:id
// SSR unique title/meta/canonical/body so crawlers are not served the shared shop shell.
app.get("/products/:id", (req, res) => {
  const id = String(req.params.id || "");
  const canonicalUrl = "https://sentinel-outfitters.com/products/" + encodeURIComponent(id);
  try {
    const product = getProductById(root, id);
    if (!product) {
      res.status(404).type("html").send(applySiteChrome(root, renderProductNotFound(root)));
      return;
    }
    res.setHeader("Link", "<" + canonicalUrl + '>; rel="canonical"');
    if (product.hidden) res.setHeader("X-Robots-Tag", "noindex, follow");
    res.type("html").send(applySiteChrome(root, renderProductPage(root, product)));
  } catch (err) {
    console.error("SSR product render failed:", err);
    // No client-side renderer exists, so never send the empty product shell with 200.
    let html;
    try {
      html = applySiteChrome(root, renderProductUnavailable(root));
    } catch (pageErr) {
      console.error("SSR product error page failed:", pageErr);
      html = PRODUCT_UNAVAILABLE_FALLBACK_HTML;
    }
    res.removeHeader("Link");
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("Retry-After", "120");
    res.setHeader("Cache-Control", "no-store");
    res.status(503).type("html").send(html);
  }
});

// Legacy query URLs → path URLs (absolute Location)
app.get("/product.html", (req, res, next) => {
  const id = req.query && req.query.id;
  if (id) {
    return res.redirect(
      301,
      "https://sentinel-outfitters.com/products/" + encodeURIComponent(String(id))
    );
  }
  return res.redirect(301, "https://sentinel-outfitters.com/shop.html");
});

// Policy pages on clean URLs, plus redirects from the old/guessable paths.
// Extensionless content aliases (serve HTML, same pattern as /returns).
app.get("/glare-guide", (req, res) => res.type("html").send(readPage(root, "glare-guide.html")));

const policyPages = { "/returns": "returns.html", "/privacy": "privacy.html", "/terms": "terms.html" };
for (const [path, file] of Object.entries(policyPages)) {
  app.get(path, (req, res) => res.type("html").send(readPage(root, file)));
}
const policyRedirects = {
  "/refund": "/returns",
  "/refund.html": "/returns",
  "/refunds": "/returns",
  "/returns.html": "/returns",
  "/privacy.html": "/privacy",
  "/terms.html": "/terms"
};
for (const [from, to] of Object.entries(policyRedirects)) {
  app.get(from, (req, res) => res.redirect(301, "https://sentinel-outfitters.com" + to));
}

// Every static HTML page gets the shared footer + business details injected.
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  let file = null;
  if (req.path === "/") file = "index.html";
  else if (/^\/[a-z0-9\-]+\.html$/i.test(req.path)) file = req.path.slice(1);
  if (!file || !existsSync(resolve(root, file))) return next();
  res.type("html").send(readPage(root, file));
});

app.use(express.static(root, { dotfiles: "deny", index: ["index.html"] }));

app.post("/create-checkout-session", async (req, res) => {
  try {
    const items = Array.isArray(req.body && req.body.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: "Cart is empty" });
    const lineItems = items.map((item) => lineItemFromCart(item, root));
    const payload = {
      mode: "payment",
      line_items: lineItems,
      success_url: siteUrl + "/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: siteUrl + "/cart.html",
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: "Free US shipping",
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" }
          }
        }
      ],
      metadata: {
        sku_list: items
          .map((item) => {
            const qty = Math.min(20, Math.max(1, Number(item.qty) || 1));
            return item.id + (item.variant ? ":" + item.variant : "") + ":" + qty;
          })
          .join(",")
      },
      integration_identifier: integrationId()
    };
    let session;
    try {
      session = await stripe.checkout.sessions.create(payload);
    } catch (err) {
      if (err && err.message && err.message.indexOf("integration_identifier") !== -1) {
        delete payload.integration_identifier;
        session = await stripe.checkout.sessions.create(payload);
      } else {
        throw err;
      }
    }
    res.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session failed:", err.message);
    res.status(400).json({ error: err.message || "Could not create checkout session" });
  }
});

app.get("/session-status", async (req, res) => {
  try {
    const id = req.query.session_id;
    if (!id) return res.status(400).json({ error: "Missing session_id" });
    const session = await stripe.checkout.sessions.retrieve(id);
    res.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details && session.customer_details.email
    });
  } catch {
    res.status(400).json({ error: "Could not load session" });
  }
});

app.use((req, res) => {
  res.status(404).type("html").send(readPage(root, "404.html"));
});

process.on("unhandledRejection", (err) => console.error("unhandledRejection", err));
process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
  process.exit(1);
});

app.listen(port, "0.0.0.0", () => {
  console.log("Sentinel Outfitters checkout on " + siteUrl);
  console.log("Orders log:", ordersFile);
  if (!webhookSecret) {
    console.log(
      "Webhook not armed. In another terminal: stripe listen --forward-to localhost:" +
        port +
        "/webhook"
    );
  }
});

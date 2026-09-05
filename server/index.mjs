import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import Stripe from "stripe";
import { lineItemFromCart } from "./catalog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const text = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch (err) {
    /* no .env */
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
const ordersFile = resolve(root, "server", "orders.jsonl");

function integrationId() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let suffix = "";
  for (let i = 0; i < 8; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return "sentinel-web-" + suffix;
}

function fulfillOrder(session) {
  const record = {
    at: new Date().toISOString(),
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency,
    customerEmail: session.customer_details && session.customer_details.email,
    metadata: session.metadata || {}
  };
  appendFileSync(ordersFile, JSON.stringify(record) + "\n");
  console.log("Fulfilled checkout session", session.id, session.payment_status);
}

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set. Run: stripe listen --forward-to localhost:" + port + "/webhook");
    return res.status(500).send("Webhook secret missing");
  }
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature failed");
    return res.status(400).send("Webhook signature failed");
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status !== "unpaid") fulfillOrder(session);
  }

  res.json({ received: true });
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
app.use(express.static(root));

app.post("/create-checkout-session", async (req, res) => {
  try {
    const items = Array.isArray(req.body && req.body.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: "Cart is empty" });
    const lineItems = items.map(lineItemFromCart);
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
        sku_list: items.map((item) => item.id + (item.variant ? ":" + item.variant : "")).join(",")
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
  } catch (err) {
    res.status(400).json({ error: "Could not load session" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log("Sentinel Outfitters checkout on " + siteUrl);
  if (!webhookSecret) {
    console.log("Webhook not armed. In another terminal: stripe listen --forward-to localhost:" + port + "/webhook");
  }
});

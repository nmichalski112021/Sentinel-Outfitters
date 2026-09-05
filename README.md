# Sentinel Outfitters

Website for **Sentinel Outfitters LLC**. Checkout uses Stripe Checkout Sessions. Paid orders are confirmed by the `checkout.session.completed` webhook.

## Local preview (required for Stripe)

```powershell
npm install
npm start
```

Open http://localhost:4242

In a second terminal, forward webhooks:

```powershell
stripe listen --forward-to localhost:4242/webhook
```

Paste the `whsec_...` signing secret into `.env` as `STRIPE_WEBHOOK_SECRET`, then restart `npm start`.

Pay with test card `4242 4242 4242 4242`. Never put the Stripe secret key in HTML or JS.

## Shop checkout flow

1. **Continue to checkout** (product or cart) calls `POST /create-checkout-session`.
2. The server returns a Checkout Session URL. The browser opens it.
3. After payment, Stripe sends `checkout.session.completed`. The server records the order in `server/orders.jsonl`.
4. The success page is only a receipt. Fulfillment is the webhook.

## GitHub Pages

The shop HTML can live on GitHub Pages. Checkout Sessions and webhooks need this Node server on a public HTTPS host (GitHub Pages cannot run `npm start`).

## Public Node host (Render)

1. Open [render.com](https://render.com) and sign in with GitHub.
2. **New → Web Service** → this repo (`Sentinel-Outfitters`).
3. Build: `npm install`. Start: `npm start`.
4. Add environment variables (do not commit them):
   - `STRIPE_SECRET_KEY` — live secret or restricted key
   - `STRIPE_PUBLISHABLE_KEY` — `pk_live_...`
   - `SITE_URL` — `https://your-service.onrender.com` (or your GitHub Pages URL if the HTML stays there)
   - `STRIPE_WEBHOOK_SECRET` — from Stripe after you create the webhook (add it on the second deploy)
5. Deploy. Copy the `https://....onrender.com` URL.
6. In Stripe live mode: Developers → Webhooks → Add endpoint  
   `https://YOUR-SERVICE.onrender.com/webhook`  
   Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`.
7. Paste the `whsec_...` signing secret into Render as `STRIPE_WEBHOOK_SECRET` and redeploy.
8. Set `checkoutApiUrl` in `js/stripe-config.js` to that `https://....onrender.com` URL and push.

Render free/starter instances sleep. Stripe retries failed webhooks; for reliable live orders, use a paid instance that stays up.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home |
| `shop.html` | Catalog |
| `product.html` | Product |
| `cart.html` | Cart |
| `success.html` | Post-checkout receipt |
| `about.html` | Craft and QC |
| `contact.html` | Inquiries |
| `shipping.html` | Shipping, returns, privacy, terms |
| `404.html` | Not-found page |

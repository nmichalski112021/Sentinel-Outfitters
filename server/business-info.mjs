// ─────────────────────────────────────────────────────────────────────────────
// Business contact details — the ONE place to edit them.
//
// Every page footer, the Contact page, the About page, and the returns/privacy/
// terms pages read these values at request time through server/site-chrome.mjs
// ({{BUSINESS_ADDRESS}}, {{BUSINESS_PHONE}}, {{BUSINESS_EMAIL}} tokens in the HTML).
//
// Address and phone confirmed by Nick 2026-11-02. Edit the values below to change
// them site-wide (one-line edit each). Do not use a virtual or mail-drop address.
// While a value is still a placeholder, any element marked
// data-requires="BUSINESS_ADDRESS" / data-requires="BUSINESS_PHONE" is hidden
// from the page, and the server logs a warning on startup.
// ─────────────────────────────────────────────────────────────────────────────
export const BUSINESS = {
  legalName: "Sentinel Outfitters LLC",
  owner: "Nicholas Michalski",
  city: "Gulfport, Mississippi",
  // Full street address, one line, e.g. "Street, Gulfport, MS ZIP".
  BUSINESS_ADDRESS: "20046 Tournament Cove S, Gulfport, MS 39503",
  // Phone as it should be displayed, e.g. "(228) 555-0100".
  BUSINESS_PHONE: "(901) 245-8015",
  BUSINESS_EMAIL: "info@sentinel-outfitters.com",
  etsyShop: "https://sentineloutfitters.etsy.com",
  etsyReviews: "https://sentineloutfitters.etsy.com#reviews"
};

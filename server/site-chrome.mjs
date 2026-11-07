import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BUSINESS } from "./business-info.mjs";

const TOKENS = ["BUSINESS_ADDRESS", "BUSINESS_PHONE", "BUSINESS_EMAIL"];
const INCLUDE_RE = /<!--\s*@include\s+([a-z0-9_\-/]+\.html)\s*-->/gi;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function telHref(phone) {
  const digits = String(phone).replace(/[^0-9+]/g, "");
  // US 10-digit numbers -> E.164 (+1XXXXXXXXXX)
  return "tel:" + (/^\d{10}$/.test(digits) ? "+1" + digits : digits);
}

/**
 * Shared site chrome for every HTML response:
 *  1. <!-- @include partials/footer.html --> is replaced by the shared partial.
 *  2. {{BUSINESS_*}} tokens (and {{BUSINESS_PHONE_TEL}}) are filled from business-info.mjs.
 */
export function applySiteChrome(rootDir, html) {
  let out = String(html).replace(INCLUDE_RE, (_, rel) => {
    const path = resolve(rootDir, rel);
    if (!path.startsWith(resolve(rootDir, "partials"))) return "";
    return readFileSync(path, "utf8");
  });
  out = out.replace(/\{\{BUSINESS_PHONE_TEL\}\}/g, () => escapeHtml(telHref(BUSINESS.BUSINESS_PHONE)));
  for (const token of TOKENS) {
    out = out.split(`{{${token}}}`).join(escapeHtml(BUSINESS[token]));
  }
  return out;
}

export function readPage(rootDir, file) {
  return applySiteChrome(rootDir, readFileSync(resolve(rootDir, file), "utf8"));
}

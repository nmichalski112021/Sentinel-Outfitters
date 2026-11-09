import { readFileSync } from "node:fs";

const text = readFileSync(new URL("../js/image-dims.js", import.meta.url), "utf8");
export const IMAGE_DIMS = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

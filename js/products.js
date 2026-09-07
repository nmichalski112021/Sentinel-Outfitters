window.SO_PRODUCTS = [
  {
    id: "diamondback-10x50-killflash",
    name: "Vortex Diamondback 10x50 Killflash ARD 2-Pack",
    shortName: "Diamondback 10x50 Killflash",
    tag: "Killflash",
    post: "parts",
    postLabel: "Post I",
    price: 5598,
    shipping: "Free US shipping",
    seoTitle: "Vortex Diamondback 10x50 Binocular Killflash ARD 2-Pack | Sentinel Outfitters",
    seoDescription: "2-pack honeycomb killflash ARDs for Vortex Diamondback 10x50 binoculars (50mm objectives). Tool-free slip-on. Cuts glass glint while glassing. $55.98. Free US shipping.",
    lead: "2-pack honeycomb killflash ARDs for Vortex Diamondback 10x50 binoculars (50mm objectives) — cuts glass glint while glassing. Not a rifle red-dot accessory.",
    description: [
      "This 2-pack is made for Vortex Diamondback 10x50 binoculars with 50mm objective lenses. It is for binoculars, not a rifle red-dot sight, and friction-fits many other 50mm binocular, scope, and spotting-scope objectives.",
      "The honeycomb grid cuts sunlight glint off the binocular glass so you stay harder to spot while hunting, scouting, birding, or glassing in the field.",
      "This listing is a pair: two ARDs, one for each binocular objective. Choose Black or Green at checkout."
    ],
    bullets: [
      "2 friction-fit 50mm killflash ARDs for binoculars (a complete pair)",
      "Tool-free slip-on install — no threads or permanent mods",
      "Honeycomb anti-reflection pattern",
      "Lightweight matte plastic; easy on/off for storage and cleaning",
      "Handmade in the USA. Ships in 1–2 business days"
    ],
    fit: "Sized for the Vortex Diamondback 10x50 outer objective barrel. Works on many 50mm objectives (Diamondback HD, Crossfire, and similar). Message us if your optic is not a Diamondback 10x50.",
    variants: [
      { id: "black", name: "Black" },
      { id: "green", name: "Green" }
    ],
    images: [
      "images/products/diamondback-1.jpg",
      "images/products/diamondback-2.jpg",
      "images/products/diamondback-3.jpg"
    ]
  },
  {
    id: "holosun-hs510c-killflash",
    name: "Holosun HS510C Killflash ARD",
    shortName: "HS510C Killflash",
    tag: "Killflash",
    post: "parts",
    postLabel: "Post I",
    price: 1999,
    shipping: "Free US shipping",
    seoTitle: "Holosun HS510C Killflash ARD — Anti-Reflection Device | Sentinel Outfitters",
    seoDescription: "Honeycomb killflash for Holosun HS510C / HE510C. Mounts with the optic's original Holosun screws. Cuts lens glare. $19.99. Printed in Gulfport, MS. Free US shipping.",
    buyerQuestion: "What's the best killflash for a Holosun HS510C?",
    lead: "Honeycomb killflash for Holosun HS510C / HE510C — mounts with the optic's original Holosun screws. $19.99.",
    description: [
      "Looking for the best killflash for a Holosun HS510C? This honeycomb ARD is made for the HS510C / HE510C housing and mounts with the optic's original Holosun screws — no extra hardware to buy.",
      "The hex grid cuts lens glare and downrange flash so your red dot is harder to pick up in the sun. Low-profile and lightweight. Printed in-house in Gulfport, MS. Free US shipping.",
      "Install with the same Holosun screws that came on the optic. No aftermarket fasteners required."
    ],
    bullets: [
      "Made for Holosun HS510C / HE510C only",
      "Uses the optic's original Holosun screws — no extra hardware",
      "Honeycomb anti-reflection pattern",
      "Black or Green",
      "Printed in-house · $19.99 · free US shipping · ships in 1–2 business days"
    ],
    fit: "Made for the Holosun HS510C open-reflex housing. This is not a universal Holosun killflash. If you run a different 510 variant or a riser, contact us before ordering.",
    variants: [
      { id: "black", name: "Black" },
      { id: "green", name: "Green" }
    ],
    images: [
      "images/products/holosun-1.jpg",
      "images/products/holosun-2.jpg",
      "images/products/holosun-3.jpg",
      "images/products/holosun-4.jpg"
    ]
  },
  {
    id: "keychain-pill-holder",
    name: "Keychain Pill Holder (2-Pack)",
    shortName: "Keychain Pill Holder",
    tag: "EDC",
    post: "field",
    postLabel: "Post II",
    price: 1299,
    shipping: "Free US shipping",
    seoTitle: "Keychain Pill Holder 2-Pack — Compact EDC Capsules | Sentinel Outfitters",
    seoDescription: "Two screw-top keychain pill holder capsules for pills, vitamins, or small EDC. Compact, ribbed, and easy to carry. $12.99. Free US shipping.",
    lead: "Two screw-top capsules for the keyring. Pills, vitamins, or small EDC — always on you, no rummaging.",
    description: [
      "A compact keychain pill holder for daily carry. Ribbed body, screw-on cap, and a loop that clips to keys, a bag, or a belt. Two capsules per order.",
      "Holds about 5–10 standard pills. Also works for small capsules, earplugs, or backup tabs you do not want loose in a pocket."
    ],
    bullets: [
      "2 capsules per pack",
      "Screw-top cap with loop for keys or a carabiner",
      "Ribbed grip, pocket-sized, lightweight",
      "Printed in-house. Made to order",
      "Ships in 1–2 business days"
    ],
    fit: "Everyday carry size. Not watertight for submersion — keep it on the ring, not in a soak.",
    variants: [],
    images: [
      "images/products/pill-2.jpg",
      "images/products/pill-4.jpg",
      "images/products/pill-3.jpg",
      "images/products/pill-1.jpg"
    ]
  }
];

window.SO_formatPrice = function (cents) {
  return "$" + (cents / 100).toFixed(2);
};

window.SO_getProduct = function (id) {
  return (window.SO_PRODUCTS || []).find((item) => item.id === id) || null;
};

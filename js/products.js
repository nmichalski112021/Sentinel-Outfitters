// Catalog flags (read by server/render-product-page.mjs, server/index.mjs, js/shop.js):
//   hidden: true          -> unlisted: not in nav, shop grid, sitemap, llms.txt or related links;
//                            the product page is served with noindex and no structured data.
//   merchantListing: false -> no Product/Offer JSON-LD, so the item stays out of Google Shopping.
// Fit wording is kept cautious on purpose: optics vary, so buyers are told to measure first.
window.SO_PRODUCTS = [
  {
    id: "diamondback-10x50-killflash",
    name: "Sentinel Outfitters Honeycomb Killflash ARD 2-Pack – fits Vortex Diamondback 10x50",
    shortName: "Killflash ARD 2-Pack – fits Diamondback 10x50",
    tag: "Killflash",
    post: "parts",
    postLabel: "Post I",
    price: 5598,
    shipping: "Free US shipping via USPS Ground Advantage · ships in 1–2 business days · 2–8 days in transit",
    seoTitle: "Sentinel Outfitters Honeycomb Killflash ARD 2-Pack – fits Vortex Diamondback 10x50",
    seoDescription: "A pair of friction-fit honeycomb anti-reflection covers made for Vortex Diamondback 10x50 binoculars. Black or Green, $55.98, free US shipping. 3D printed by Sentinel Outfitters in Gulfport, MS. Not affiliated with or endorsed by Vortex Optics.",
    lead: "A pair of friction-fit honeycomb anti-reflection covers made for the Vortex Diamondback 10x50. Black or Green. $55.98 with free US shipping.",
    description: [
      "One honeycomb ARD for each 50mm objective of a Vortex Diamondback 10x50 binocular. It slips over the objective — no threads, tools, or permanent changes. Choose Black or Green at checkout.",
      "The honeycomb grid cuts sunlight glint off the objective glass while hunting, scouting, or glassing. Small-batch 3D printed by Sentinel Outfitters in Gulfport, MS."
    ],
    bullets: [
      "2 friction-fit honeycomb ARDs (one per objective)",
      "Made for the Vortex Diamondback 10x50. Other 50mm binoculars, including Diamondback HD and Crossfire models, may not fit — measure your objective's outside diameter first",
      "Tool-free slip-on — no threads or permanent mods",
      "Black or Green",
      "$55.98 · free US shipping via USPS Ground Advantage · ships in 1–2 business days"
    ],
    fit: "Made for the outer objective of the Vortex Diamondback 10x50. Other 50mm binoculars — including Diamondback HD and Crossfire models — vary in outside diameter and may not fit. Measure your objective's outside diameter and message us before ordering if your binocular is not a Diamondback 10x50.",
    brandNote: "Vortex and Diamondback are trademarks of Vortex Optics. Sentinel Outfitters is not affiliated with or endorsed by Vortex Optics.",
    faq: [
      { q: "Is this one cover or a pair?", a: "A pair — one honeycomb ARD for each objective lens." },
      { q: "How does it mount?", a: "It slips over each objective by friction. No threads, tools, or permanent changes. Pull it off for cleaning or low light." },
      { q: "Will it fit a Diamondback HD, Crossfire, or other 50mm binocular?", a: "It may not. It is made for the Diamondback 10x50, and other 50mm binoculars vary in outside diameter. Measure your objective's outside diameter and message us before ordering." }
    ],
    variants: [ { id: "black", name: "Black" }, { id: "green", name: "Green" } ],
    reviews: [],
    imageAlts: [
      "Honeycomb killflash ARD pair for Vortex Diamondback 10x50 binoculars",
      "Honeycomb killflash ARD seated on a binocular objective lens",
      "Close-up of the honeycomb grid"
    ],
    images: [
      "images/products/diamondback-1.jpg",
      "images/products/diamondback-2.jpg",
      "images/products/diamondback-3.jpg"
    ]
  },

  {
    id: "holosun-hs510c-killflash",
    name: "Sentinel Outfitters Honeycomb ARD – fits Holosun HS510C",
    shortName: "Honeycomb ARD – fits Holosun HS510C",
    tag: "Killflash",
    post: "parts",
    postLabel: "Post I",
    price: 1999,
    shipping: "Free US shipping via USPS Ground Advantage · ships in 1–2 business days · 2–8 days in transit",
    merchantListing: false,
    seoTitle: "Sentinel Outfitters Honeycomb ARD – fits Holosun HS510C",
    seoDescription: "A honeycomb anti-reflection insert made to fit the Holosun HS510C / HE510C housing. Installs with the optic's original screws. $19.99, Black or Green, free US shipping. Not affiliated with or endorsed by Holosun.",
    lead: "A honeycomb anti-reflection insert made to fit the Holosun HS510C / HE510C. Installs with the optic's original screws. $19.99 · Black or Green · free US shipping.",
    description: [
      "Sized for the HS510C / HE510C open housing and installed with the optic's original screws rather than a clip-on or friction sleeve. It is not a universal ARD and will not fit other Holosun models.",
      "$19.99 with free US shipping. Black or Green. Small-batch 3D printed by Sentinel Outfitters in Gulfport, MS."
    ],
    bullets: [
      "Made to fit HS510C / HE510C only",
      "Installs with the optic's original screws",
      "Honeycomb anti-reflection · Black or Green",
      "$19.99 · free US shipping via USPS Ground Advantage · ships in 1–2 business days"
    ],
    fit: "Made for the Holosun HS510C open-reflex housing and the matching HE510C. It will not fit 507/508/403/EPS footprints. If you run a different 510 variant or a riser, contact us before ordering.",
    brandNote: "Holosun is a trademark of its owner. Sentinel Outfitters is not affiliated with or endorsed by Holosun.",
    faq: [
      { q: "How does it attach?", a: "It installs with the optic's original screws. There is no clip-on or friction sleeve on this part." },
      { q: "Will it fit other Holosun optics?", a: "No. It is made for the HS510C / HE510C only." }
    ],
    variants: [ { id: "black", name: "Black" }, { id: "green", name: "Green" } ],
    images: [
      "images/products/holosun-1.jpg",
      "images/products/holosun-2.jpg",
      "images/products/holosun-3.jpg",
      "images/products/holosun-4.jpg"
    ]
  },
  {
    id: "sig-romeo5-gen1-killflash",
    name: "Sentinel Outfitters Honeycomb ARD – fits Sig Sauer Romeo5 Gen 1",
    shortName: "Honeycomb ARD – fits Romeo5 Gen 1",
    tag: "Killflash",
    post: "parts",
    postLabel: "Post I",
    price: 1999,
    shipping: "Free US shipping via USPS Ground Advantage · ships in 1–2 business days · 2–8 days in transit",
    hidden: true,
    merchantListing: false,
    seoTitle: "Sentinel Outfitters Honeycomb ARD – fits Sig Sauer Romeo5 Gen 1",
    seoDescription: "Friction-fit honeycomb anti-reflection cover made to fit the Sig Sauer Romeo5 Gen 1. Not affiliated with or endorsed by Sig Sauer.",
    lead: "A friction-fit honeycomb anti-reflection cover made to fit the Sig Sauer Romeo5 Gen 1.",
    description: [
      "Honeycomb ARD made to fit the Romeo5 Gen 1 housing. Friction fit — no extra screws, adapters, or hardware.",
      "The honeycomb grid cuts lens glare in sunlight. Easy to take off for cleaning."
    ],
    bullets: [
      "1 honeycomb ARD made to fit the Romeo5 Gen 1",
      "Friction fit — no tools",
      "Black or Green",
      "Free US shipping via USPS Ground Advantage · ships in 1–2 business days"
    ],
    fit: "Made for the Sig Sauer Romeo5 Gen 1 housing. It does not fit the Romeo5 Gen II or XDR. Contact us before ordering if you run a different Romeo.",
    brandNote: "Sig Sauer and Romeo5 are trademarks of Sig Sauer, Inc. Sentinel Outfitters is not affiliated with or endorsed by Sig Sauer.",
    faq: [
      { q: "Will it fit the Romeo5 Gen II or XDR?", a: "No. Gen 1 only. Contact us before ordering if you run a different Romeo." }
    ],
    variants: [ { id: "black", name: "Black" }, { id: "green", name: "Green" } ],
    images: []
  },
  {
    id: "scope-56mm-killflash",
    name: "Sentinel Outfitters Honeycomb ARD – fits 56mm Scope Objectives",
    shortName: "Honeycomb ARD – fits 56mm objectives",
    tag: "Killflash",
    post: "parts",
    postLabel: "Post I",
    price: 2499,
    shipping: "Free US shipping via USPS Ground Advantage · ships in 1–2 business days · 2–8 days in transit",
    hidden: true,
    merchantListing: false,
    seoTitle: "Sentinel Outfitters Honeycomb ARD – fits 56mm Scope Objectives",
    seoDescription: "Friction-fit honeycomb anti-reflection cover sized for 56mm rifle scope objectives. Measure your objective's outside diameter before ordering.",
    lead: "A friction-fit honeycomb anti-reflection cover sized for 56mm rifle scope objectives.",
    description: [
      "Honeycomb ARD sized for 56mm objective rifle scopes. Slips onto the objective — no threads, adapters, or extra hardware.",
      "Outside diameters vary between scope makers, so measure your objective's outside diameter before ordering."
    ],
    bullets: [
      "1 friction-fit honeycomb ARD",
      "Sized for 56mm objectives — measure your objective's outside diameter first",
      "Black or Green",
      "Free US shipping via USPS Ground Advantage · ships in 1–2 business days"
    ],
    fit: "Sized for 56mm scope objectives. Outside diameters vary between scope makers and models, so it may not fit every 56mm scope. Measure your objective's outside diameter and message us before ordering if you are unsure.",
    brandNote: "Sentinel Outfitters is not affiliated with or endorsed by any scope manufacturer.",
    faq: [
      { q: "Is this a threaded sunshade?", a: "No. It is a friction-fit honeycomb ARD. No threads, adapters, or extra hardware." }
    ],
    variants: [ { id: "black", name: "Black" }, { id: "green", name: "Green" } ],
    images: []
  },
  {
    id: "keychain-pill-holder",
    name: "Sentinel Outfitters Keychain Pill Holder (2-Pack)",
    shortName: "Keychain Pill Holder (2-Pack)",
    tag: "EDC",
    post: "field",
    postLabel: "Post II",
    price: 1299,
    shipping: "Free US shipping via USPS Ground Advantage · ships in 1–2 business days · 2–8 days in transit",
    seoTitle: "Sentinel Outfitters Keychain Pill Holder (2-Pack)",
    seoDescription: "Two screw-top keychain pill holder capsules for pills, vitamins, or small EDC items. $12.99. Free US shipping, ships in 1–2 business days.",
    lead: "Two screw-top capsules for the keyring. Pills, vitamins, or small EDC — always on you.",
    description: [
      "A compact keychain pill holder for daily carry. Ribbed body, screw-on cap, and a loop that clips to keys, a bag, or a belt. Two capsules per order.",
      "Holds about 5–10 standard pills. Also works for small capsules, earplugs, or backup tabs you do not want loose in a pocket."
    ],
    bullets: [
      "2 capsules per pack",
      "Screw-top cap with loop for keys or a carabiner",
      "Ribbed grip, pocket-sized, lightweight",
      "Printed in-house in Gulfport, MS. In stock",
      "Free US shipping via USPS Ground Advantage · ships in 1–2 business days"
    ],
    fit: "Everyday carry size. Not watertight for submersion — keep it on the ring, not in a soak.",
    faq: [
      { q: "How many capsules do I get?", a: "Two screw-top capsules per order." },
      { q: "Is it waterproof?", a: "No. It is not watertight for submersion — keep it on the ring, not in a soak." }
    ],
    variants: [],
    reviews: [
      {
        name: "Mark",
        rating: 5,
        date: "Jul 21, 2026",
        source: "Etsy",
        listingId: "4449226922",
        sourceUrl: "https://www.etsy.com/listing/4449226922",
        quote: "I'm generally not someone who writes reviews unless I'm very happy or disappointed in a product and I'm so very HAPPY with this product and the service. I was looking for a pill holder and asked Nick if something like a Tums pill could fit inside this. The answer was no, BUT Nick took the time to redesign the item and made it specifically for my request within a matter of just hours. He truly went above and beyond my high expectations. Nick 3D prints this item out of his house and he enlarged the original pill bottle to accommodate Tums for me and I'm so thrilled with his service. I highly recommend this product and this store. Thank you so much, Nick!"
      }
    ],
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

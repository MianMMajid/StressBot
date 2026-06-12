import type { LogEvent } from "@/lib/simulation";

export type TranslationMode = "friendly" | "technical";

/* ── Dictionary maps ─────────────────────────────────────────────── */

/** Known selectors → human names. Checked before the regex fallback. */
const SELECTOR_DICTIONARY: Record<string, string> = {
  // Login page
  '[data-test="username"]':     "the Username text field",
  '[data-test="password"]':     "the Password text field",
  '[data-test="login-button"]': "the Login button",

  // Inventory — navigation
  ".shopping_cart_link":                    "the Shopping Cart icon",
  ".bm-burger-button":                      "the hamburger menu button",
  '[data-test="product-sort-container"]':   "the Product Sort dropdown",

  // Inventory — product image/title links
  ".inventory_item_name":                              "a product title link",
  ".inventory_item_img":                               "a product image link",
  ".inventory_item:nth-child(1) .inventory_item_img":  "the Backpack product image",
  ".inventory_item:nth-child(1) .inventory_item_name": "the Backpack title link",
  ".inventory_item:nth-child(2) .inventory_item_img":  "the Bike Light product image",
  ".inventory_item:nth-child(2) .inventory_item_name": "the Bike Light title link",
  ".inventory_item:nth-child(3) .inventory_item_img":  "the Bolt T-Shirt product image",
  ".inventory_item:nth-child(4) .inventory_item_img":  "the Fleece Jacket product image",
  ".inventory_item:nth-child(5) .inventory_item_img":  "the Onesie product image",
  ".inventory_item:nth-child(6) .inventory_item_img":  "the Red T-Shirt product image",

  // Inventory — Add to Cart buttons (all 6 products)
  '[data-test="add-to-cart-sauce-labs-backpack"]':                 "the Backpack 'Add to Cart' button",
  '[data-test="add-to-cart-sauce-labs-bike-light"]':               "the Bike Light 'Add to Cart' button",
  '[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]':             "the Bolt T-Shirt 'Add to Cart' button",
  '[data-test="add-to-cart-sauce-labs-fleece-jacket"]':            "the Fleece Jacket 'Add to Cart' button",
  '[data-test="add-to-cart-sauce-labs-onesie"]':                   "the Onesie 'Add to Cart' button",
  '[data-test="add-to-cart-test.allthethings()-t-shirt-(red)"]':   "the Red T-Shirt 'Add to Cart' button",

  // Cart page — Remove buttons (all 6 products)
  '[data-test="remove-sauce-labs-backpack"]':               "the Backpack 'Remove' button",
  '[data-test="remove-sauce-labs-bike-light"]':             "the Bike Light 'Remove' button",
  '[data-test="remove-sauce-labs-bolt-t-shirt"]':           "the Bolt T-Shirt 'Remove' button",
  '[data-test="remove-sauce-labs-fleece-jacket"]':          "the Fleece Jacket 'Remove' button",
  '[data-test="remove-sauce-labs-onesie"]':                 "the Onesie 'Remove' button",
  '[data-test="remove-test.allthethings()-t-shirt-(red)"]': "the Red T-Shirt 'Remove' button",

  // Cart page — navigation
  '[data-test="continue-shopping"]': "the 'Continue Shopping' button",
  '[data-test="checkout"]':          "the 'Checkout' button",

  // Checkout Step 1 — form fields & buttons
  '[data-test="firstName"]':  "the First Name input field",
  '[data-test="lastName"]':   "the Last Name input field",
  '[data-test="postalCode"]': "the Postal Code input field",
  '[data-test="cancel"]':     "the 'Cancel' button",
  '[data-test="continue"]':   "the 'Continue' button",

  // Checkout Step 2 — order summary & buttons
  ".summary_info":         "the order summary section",
  '[data-test="finish"]':  "the 'Finish' button",
};

/** Known endpoints → plain-language activity descriptions. */
const ENDPOINT_DICTIONARY: Record<string, string> = {
  "/api/v1/auth/login":       "logging you in",
  "/api/v1/inventory":        "loading the product list",
  "/api/v1/cart":             "updating your shopping cart",
  "/api/v1/checkout":         "processing your checkout",
  "/api/v1/orders/complete":  "completing your order",
  "/api/v1/session/heartbeat":"keeping your session alive",
};

/** Error signatures → human outcomes. First match wins. */
const ERROR_RULES: [RegExp, string][] = [
  [/TypeError|null reference|undefined/i, "the application crashed completely"],
  [/RangeError|call stack/i,              "the app got stuck repeating itself until it froze"],
  [/401/,                                 "the server rejected the login credentials"],
  [/403/,                                 "the server refused permission and blocked the request"],
  [/400/,                                 "the server rejected the data because it looked invalid"],
  [/429/,                                 "the server asked us to slow down (too many requests)"],
  [/503/,                                 "the server was temporarily unavailable"],
  [/abort/i,                              "the connection dropped before the request could finish"],
  [/5\d\d/,                               "the server itself broke while answering"],
];

/* ── Fallback parsers (regex-driven, no frozen strings) ──────────── */

function humanizeSelector(selector: string): string {
  const hit = SELECTOR_DICTIONARY[selector];
  if (hit) return hit;
  const words = selector
    .replace(/^\[data-test="(.+)"\]$/, "$1")
    .replace(/^[#.]/, "")
    .split(/[-_.:()\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return `the '${words || "Unknown"}' element`;
}

function humanizeEndpoint(endpoint: string): string {
  const path = endpoint.replace(/^[A-Z]+\s+/, "");
  const hit = ENDPOINT_DICTIONARY[path];
  if (hit) return hit;
  const tail = path.split("/").filter(Boolean).pop() ?? "data";
  return `talking to the server about ${tail.replace(/[-_]+/g, " ")}`;
}

function humanizeError(raw: string): string {
  for (const [re, text] of ERROR_RULES) {
    if (re.test(raw)) return text;
  }
  return "something unexpected went wrong";
}

/* ── Core translation engine ─────────────────────────────────────── */

export function translateTelemetry(
  logItem: LogEvent,
  mode: TranslationMode
): string {
  if (mode === "technical") {
    switch (logItem.actionType) {
      case "CLICK":
        return `SHOTGUN_CLICK dispatch → ${logItem.targetElement ?? "(no target)"} pointerdown/pointerup ×8 @4ms`;
      case "INPUT":
        return `FORM_FLOOD inject → ${logItem.targetElement ?? "(no target)"} payload=5000ch surrogate-pairs`;
      case "NETWORK":
        return `${logItem.networkEndpoint ?? "(unknown endpoint)"} → ${logItem.rawErrorDetails ?? "HTTP 200 OK"}`;
      case "EXCEPTION":
        return `Uncaught ${logItem.rawErrorDetails ?? "Error"} at chunk-app.js:412:19`;
    }
  }

  switch (logItem.actionType) {
    case "CLICK": {
      const target = humanizeSelector(logItem.targetElement ?? "");
      return `Rapidly clicked ${target} over and over`;
    }
    case "INPUT": {
      const target = humanizeSelector(logItem.targetElement ?? "");
      return `Typed a huge flood of random text into ${target}`;
    }
    case "NETWORK": {
      const activity = humanizeEndpoint(logItem.networkEndpoint ?? "");
      if (!logItem.rawErrorDetails) {
        return `Tried ${activity} — it worked fine`;
      }
      return `Tried ${activity} — but ${humanizeError(logItem.rawErrorDetails)}`;
    }
    case "EXCEPTION":
      return `While stress-testing, ${humanizeError(logItem.rawErrorDetails ?? "")}`;
  }
}

/** Multi-line raw trace for the expanded dark-console view. */
export function buildTechnicalTrace(logItem: LogEvent): string {
  const lines = [
    `▸ ${translateTelemetry(logItem, "technical")}`,
    `  actionType : ${logItem.actionType}`,
  ];
  if (logItem.targetElement) {
    lines.push(`  target     : ${logItem.targetElement}`);
  }
  if (logItem.networkEndpoint) {
    lines.push(`  endpoint   : ${logItem.networkEndpoint}`);
  }
  if (logItem.rawErrorDetails) {
    lines.push(`  detail     : ${logItem.rawErrorDetails}`);
  }
  lines.push(
    `  critical   : ${logItem.isCritical}`,
    `  ts         : ${logItem.ts}  agent=${logItem.user}`
  );
  return lines.join("\n");
}

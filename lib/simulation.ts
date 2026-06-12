export type SimulationPhase = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";

export const DEFAULT_TARGET_URL = "https://www.saucedemo.com";

export const TICK_MS = 400;

/** Full chaos run length (ticks); each tick emits one log line per virtual user. */
export const TOTAL_TICKS = 36;

export const VIRTUAL_USER_COUNT = 10;

export type VirtualUser = {
  id: string;
  /** Hex stroke/fill for canvas + terminal swatch */
  color: string;
};

export const VIRTUAL_USERS: VirtualUser[] = [
  { id: "User_01", color: "#FFFFFF" },
  { id: "User_02", color: "#00E5FF" },
  { id: "User_03", color: "#FF6B6B" },
  { id: "User_04", color: "#C9FF4D" },
  { id: "User_05", color: "#B794F6" },
  { id: "User_06", color: "#FFB347" },
  { id: "User_07", color: "#67E8F9" },
  { id: "User_08", color: "#F472B6" },
  { id: "User_09", color: "#94FADB" },
  { id: "User_10", color: "#FDE68A" },
];

/** Raw, unparsed backend telemetry payload — the terminal translates these
 *  at runtime via translateTelemetry() instead of rendering frozen strings. */
export interface LogEvent {
  id: string;
  user: string;
  isCritical: boolean;
  actionType: "CLICK" | "INPUT" | "NETWORK" | "EXCEPTION";
  targetElement?: string; // e.g., '[data-test="username"]'
  networkEndpoint?: string; // e.g., "POST /api/v1/cart"
  rawErrorDetails?: string; // e.g., "HTTP 400 Bad Request"
  /** display metadata attached at emission time */
  ts: string;
  userColor: string;
}

type RawEventSeed = Omit<LogEvent, "id" | "user" | "userColor" | "ts">;

/**
 * Event pool covering EVERY interactive element across all pages of
 * www.saucedemo.com:
 *   Login → Inventory → Product Detail → Cart → Checkout Step 1 → Step 2
 *
 * Uses real data-test selectors from the live site.
 */
const EVENT_POOL: RawEventSeed[] = [
  // ── LOGIN PAGE ──────────────────────────────────────────────────────────
  { actionType: "INPUT",   targetElement: '[data-test="username"]',     isCritical: false },
  { actionType: "INPUT",   targetElement: '[data-test="password"]',     isCritical: false },
  { actionType: "CLICK",   targetElement: '[data-test="login-button"]', isCritical: false },
  {
    actionType: "NETWORK",
    networkEndpoint: "POST /api/v1/auth/login",
    rawErrorDetails: "HTTP 401 Unauthorized",
    isCritical: true,
  },

  // ── INVENTORY PAGE — sort & navigation ──────────────────────────────────
  { actionType: "CLICK",   targetElement: '[data-test="product-sort-container"]', isCritical: false },
  { actionType: "NETWORK", networkEndpoint: "GET /api/v1/inventory",              isCritical: false },
  { actionType: "CLICK",   targetElement: ".shopping_cart_link",                  isCritical: false },
  { actionType: "CLICK",   targetElement: ".bm-burger-button",                    isCritical: false },

  // ── INVENTORY PAGE — Add to cart (all 6 products) ─────────────────────
  { actionType: "CLICK", targetElement: '[data-test="add-to-cart-sauce-labs-backpack"]',                  isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="add-to-cart-sauce-labs-bike-light"]',                isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]',              isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="add-to-cart-sauce-labs-fleece-jacket"]',             isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="add-to-cart-sauce-labs-onesie"]',                    isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="add-to-cart-test.allthethings()-t-shirt-(red)"]',    isCritical: false },
  {
    actionType: "NETWORK",
    networkEndpoint: "POST /api/v1/cart",
    rawErrorDetails: "HTTP 400 Bad Request",
    isCritical: true,
  },

  // ── INVENTORY PAGE — product title / image links ──────────────────────
  { actionType: "CLICK", targetElement: ".inventory_item_name",  isCritical: false },
  { actionType: "CLICK", targetElement: ".inventory_item_img",   isCritical: false },

  // ── CART PAGE ──────────────────────────────────────────────────────────
  { actionType: "CLICK", targetElement: '[data-test="remove-sauce-labs-backpack"]',                isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="remove-sauce-labs-bike-light"]',              isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="remove-sauce-labs-bolt-t-shirt"]',            isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="remove-sauce-labs-fleece-jacket"]',           isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="remove-sauce-labs-onesie"]',                  isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="remove-test.allthethings()-t-shirt-(red)"]',  isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="continue-shopping"]',                         isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="checkout"]',                                  isCritical: false },
  {
    actionType: "NETWORK",
    networkEndpoint: "POST /api/v1/cart",
    rawErrorDetails: "Request aborted after 12ms",
    isCritical: true,
  },

  // ── CHECKOUT STEP 1 ────────────────────────────────────────────────────
  { actionType: "INPUT", targetElement: '[data-test="firstName"]',  isCritical: false },
  { actionType: "INPUT", targetElement: '[data-test="lastName"]',   isCritical: false },
  { actionType: "INPUT", targetElement: '[data-test="postalCode"]', isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="cancel"]',     isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="continue"]',   isCritical: false },
  {
    actionType: "EXCEPTION",
    rawErrorDetails: "TypeError: Cannot read properties of undefined (reading 'token')",
    isCritical: true,
  },

  // ── CHECKOUT STEP 2 ────────────────────────────────────────────────────
  { actionType: "CLICK", targetElement: '[data-test="finish"]',  isCritical: false },
  { actionType: "CLICK", targetElement: '[data-test="cancel"]',  isCritical: false },
  {
    actionType: "NETWORK",
    networkEndpoint: "POST /api/v1/orders/complete",
    rawErrorDetails: "HTTP 503 Service Unavailable",
    isCritical: true,
  },

  // ── CROSS-PAGE STRESS ──────────────────────────────────────────────────
  {
    actionType: "NETWORK",
    networkEndpoint: "GET /api/v1/session/heartbeat",
    rawErrorDetails: "HTTP 429 Too Many Requests",
    isCritical: false,
  },
  {
    actionType: "EXCEPTION",
    rawErrorDetails: "RangeError: Maximum call stack size exceeded",
    isCritical: true,
  },
];

function timeStamp(): string {
  const d = new Date();
  const p = (n: number, w: number) => n.toString().padStart(w, "0");
  return `${p(d.getHours(), 2)}:${p(d.getMinutes(), 2)}:${p(d.getSeconds(), 2)}.${p(d.getMilliseconds(), 3)}`;
}

/** Deterministic-ish chaos per tick so the demo feels structured but busy. */
export function buildTickLogEntries(tick: number): LogEvent[] {
  return VIRTUAL_USERS.map((u, i) => {
    const seed = EVENT_POOL[(tick + i * 3) % EVENT_POOL.length];
    return {
      ...seed,
      id: `${tick}-${u.id}-${seed.actionType}`,
      ts: timeStamp(),
      user: u.id,
      userColor: u.color,
    };
  });
}

export type CursorSnapshot = {
  userId: string;
  color: string;
  /** 0–1 relative to sandbox inner content box */
  x: number;
  y: number;
};

export type ClickRingSnapshot = {
  id: string;
  x: number;
  y: number;
  /** 0–1 radius growth for draw loop */
  r: number;
};

/**
 * Normalized (0–1) coordinates for every interactive element across all
 * pages of www.saucedemo.com. Cursors are routed toward these positions
 * rather than driven by pure sine waves.
 */
export type StressTarget = {
  x: number;
  y: number;
  selector: string;
};

export const SAUCEDEMO_STRESS_TARGETS: StressTarget[] = [
  // ── Login page ──────────────────────────────────────────────────────────
  { x: 0.50, y: 0.38, selector: '[data-test="username"]' },
  { x: 0.50, y: 0.50, selector: '[data-test="password"]' },
  { x: 0.50, y: 0.61, selector: '[data-test="login-button"]' },

  // ── Inventory — header controls ─────────────────────────────────────────
  { x: 0.93, y: 0.08, selector: ".shopping_cart_link" },
  { x: 0.04, y: 0.08, selector: ".bm-burger-button" },
  { x: 0.82, y: 0.20, selector: '[data-test="product-sort-container"]' },

  // ── Inventory — product 1: Backpack ────────────────────────────────────
  { x: 0.22, y: 0.31, selector: ".inventory_item:nth-child(1) .inventory_item_img" },
  { x: 0.22, y: 0.41, selector: ".inventory_item:nth-child(1) .inventory_item_name" },
  { x: 0.22, y: 0.50, selector: '[data-test="add-to-cart-sauce-labs-backpack"]' },

  // ── Inventory — product 2: Bike Light ──────────────────────────────────
  { x: 0.72, y: 0.31, selector: ".inventory_item:nth-child(2) .inventory_item_img" },
  { x: 0.72, y: 0.41, selector: ".inventory_item:nth-child(2) .inventory_item_name" },
  { x: 0.72, y: 0.50, selector: '[data-test="add-to-cart-sauce-labs-bike-light"]' },

  // ── Inventory — product 3: Bolt T-Shirt ────────────────────────────────
  { x: 0.22, y: 0.60, selector: ".inventory_item:nth-child(3) .inventory_item_img" },
  { x: 0.22, y: 0.70, selector: '[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]' },

  // ── Inventory — product 4: Fleece Jacket ───────────────────────────────
  { x: 0.72, y: 0.60, selector: ".inventory_item:nth-child(4) .inventory_item_img" },
  { x: 0.72, y: 0.70, selector: '[data-test="add-to-cart-sauce-labs-fleece-jacket"]' },

  // ── Inventory — product 5: Onesie ──────────────────────────────────────
  { x: 0.22, y: 0.82, selector: ".inventory_item:nth-child(5) .inventory_item_img" },
  { x: 0.22, y: 0.90, selector: '[data-test="add-to-cart-sauce-labs-onesie"]' },

  // ── Inventory — product 6: Red T-Shirt ─────────────────────────────────
  { x: 0.72, y: 0.82, selector: ".inventory_item:nth-child(6) .inventory_item_img" },
  { x: 0.72, y: 0.90, selector: '[data-test="add-to-cart-test.allthethings()-t-shirt-(red)"]' },

  // ── Cart page ───────────────────────────────────────────────────────────
  { x: 0.84, y: 0.36, selector: '[data-test="remove-sauce-labs-backpack"]' },
  { x: 0.84, y: 0.48, selector: '[data-test="remove-sauce-labs-bike-light"]' },
  { x: 0.84, y: 0.60, selector: '[data-test="remove-sauce-labs-bolt-t-shirt"]' },
  { x: 0.84, y: 0.72, selector: '[data-test="remove-sauce-labs-fleece-jacket"]' },
  { x: 0.20, y: 0.84, selector: '[data-test="continue-shopping"]' },
  { x: 0.80, y: 0.84, selector: '[data-test="checkout"]' },

  // ── Checkout Step 1 ─────────────────────────────────────────────────────
  { x: 0.50, y: 0.34, selector: '[data-test="firstName"]' },
  { x: 0.50, y: 0.47, selector: '[data-test="lastName"]' },
  { x: 0.50, y: 0.60, selector: '[data-test="postalCode"]' },
  { x: 0.20, y: 0.78, selector: '[data-test="cancel"]' },
  { x: 0.80, y: 0.78, selector: '[data-test="continue"]' },

  // ── Checkout Step 2 ─────────────────────────────────────────────────────
  { x: 0.50, y: 0.50, selector: ".summary_info" },
  { x: 0.20, y: 0.86, selector: '[data-test="cancel"]' },
  { x: 0.80, y: 0.86, selector: '[data-test="finish"]' },
];

// Stability report is compiled dynamically at runtime by lib/report-compiler.ts
// based on the actual telemetry events captured during each session.

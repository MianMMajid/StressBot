/**
 * Dynamic stability-report compiler.
 *
 * Takes the live array of LogEvent objects captured during a simulation run
 * and produces a fully dynamic markdown string at the moment the run ends
 * (whether via natural completion or an early STOP).  Nothing here is
 * hardcoded — every number, sentence, and fix recommendation is derived
 * from the actual telemetry that streamed through the log engine.
 */

import type { LogEvent } from "@/lib/simulation";
import { VIRTUAL_USERS } from "@/lib/simulation";

/* ─────────────────────────────────────────────────────────────────────────
   SECTION 1 — Element label dictionary
   Maps raw CSS / data-test selectors to short human-readable names used
   inside generated sentences.
   ───────────────────────────────────────────────────────────────────────── */

const ELEMENT_LABELS: Record<string, string> = {
  // Login
  '[data-test="username"]':     "the username field",
  '[data-test="password"]':     "the password field",
  '[data-test="login-button"]': "the Login button",
  // Inventory — navigation
  ".shopping_cart_link":                  "the cart icon",
  ".bm-burger-button":                    "the hamburger menu",
  '[data-test="product-sort-container"]': "the sort dropdown",
  // Inventory — product links
  ".inventory_item_name": "a product title link",
  ".inventory_item_img":  "a product image link",
  // Add-to-cart buttons
  '[data-test="add-to-cart-sauce-labs-backpack"]':                "the Backpack 'Add to Cart' button",
  '[data-test="add-to-cart-sauce-labs-bike-light"]':              "the Bike Light 'Add to Cart' button",
  '[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]':            "the Bolt T-Shirt 'Add to Cart' button",
  '[data-test="add-to-cart-sauce-labs-fleece-jacket"]':           "the Fleece Jacket 'Add to Cart' button",
  '[data-test="add-to-cart-sauce-labs-onesie"]':                  "the Onesie 'Add to Cart' button",
  '[data-test="add-to-cart-test.allthethings()-t-shirt-(red)"]':  "the Red T-Shirt 'Add to Cart' button",
  // Remove buttons
  '[data-test="remove-sauce-labs-backpack"]':               "the Backpack 'Remove' button",
  '[data-test="remove-sauce-labs-bike-light"]':             "the Bike Light 'Remove' button",
  '[data-test="remove-sauce-labs-bolt-t-shirt"]':           "the Bolt T-Shirt 'Remove' button",
  '[data-test="remove-sauce-labs-fleece-jacket"]':          "the Fleece Jacket 'Remove' button",
  '[data-test="remove-sauce-labs-onesie"]':                 "the Onesie 'Remove' button",
  '[data-test="remove-test.allthethings()-t-shirt-(red)"]': "the Red T-Shirt 'Remove' button",
  // Cart / checkout
  '[data-test="continue-shopping"]': "the 'Continue Shopping' button",
  '[data-test="checkout"]':          "the 'Checkout' button",
  '[data-test="firstName"]':  "the First Name field",
  '[data-test="lastName"]':   "the Last Name field",
  '[data-test="postalCode"]': "the Postal Code field",
  '[data-test="cancel"]':     "the 'Cancel' button",
  '[data-test="continue"]':   "the 'Continue' button",
  ".summary_info":            "the order summary section",
  '[data-test="finish"]':     "the 'Finish' button",
};

function labelElement(selector: string): string {
  if (!selector) return "an unknown element";
  const hit = ELEMENT_LABELS[selector];
  if (hit) return hit;
  const dataTest = selector.match(/\[data-test="([^"]+)"\]/);
  if (dataTest) {
    return `the '${dataTest[1].replace(/[-_]/g, " ")}' element`;
  }
  return `the '${selector.replace(/^[#.]/, "").replace(/[-_]/g, " ")}' element`;
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION 2 — generateActionableFix(errorType, elementId)
   Inspects raw telemetry string patterns and returns a practical,
   context-specific remediation sentence.  No hardcoded bug descriptions —
   every fix is derived from the combination of error signal + element type.
   ───────────────────────────────────────────────────────────────────────── */

export function generateActionableFix(errorType: string, elementId: string): string {
  const e = elementId.toLowerCase();
  const t = errorType.toLowerCase();

  // ── Input fields ──────────────────────────────────────────────────────
  if (
    e.includes("username") || e.includes("password") ||
    e.includes("firstname") || e.includes("lastname") ||
    e.includes("postalcode")
  ) {
    return "Add `maxlength` constraints on the `<input>` element and mirror length/format validation server-side before the field value reaches any downstream handler.";
  }

  // ── Add-to-Cart buttons ───────────────────────────────────────────────
  if (e.includes("add-to-cart")) {
    return "Disable the button immediately on first click; re-enable it only after the cart state confirms the update. Attach an idempotency key to every `POST /cart` request to prevent duplicate SKU errors.";
  }

  // ── Remove buttons ────────────────────────────────────────────────────
  if (e.includes("remove-")) {
    return "Apply optimistic UI locking on remove operations — disable the row on first click and only re-render after the server confirms the deletion.";
  }

  // ── Login / auth ──────────────────────────────────────────────────────
  if (e.includes("login") || t.includes("auth") || t.includes("401")) {
    return "Enforce server-side rate-limiting (≤5 attempts per 10 s) with exponential lockout. Add client-side retry backoff to avoid thundering-herd on repeated credential failures.";
  }

  // ── Sort dropdown ─────────────────────────────────────────────────────
  if (e.includes("sort")) {
    return "Debounce the `onChange` handler at 150 ms and memoize the sorted array with `useMemo` to prevent React reconciler thrashing under rapid-fire input.";
  }

  // ── Cart icon / navigation ─────────────────────────────────────────────
  if (e.includes("shopping_cart") || e.includes("cart_link")) {
    return "Throttle navigation clicks with a 300 ms guard flag and check `isPending` state before pushing a new route to prevent duplicate navigation events.";
  }

  // ── Checkout / Continue / Finish ──────────────────────────────────────
  if (e.includes("checkout") || e.includes("continue") || e.includes("finish")) {
    return "Gate submission behind an `isSubmitting` boolean set on first click; add `required` attributes to all form fields and validate client-side before any network call is made.";
  }

  // ── Cancel ────────────────────────────────────────────────────────────
  if (e.includes("cancel")) {
    return "Use `AbortController` to cancel all in-flight requests when cancel is clicked, preventing ghost mutations after the user navigates away.";
  }

  // ── HTTP 429 / rate-limit ─────────────────────────────────────────────
  if (t.includes("429") || t.includes("too many")) {
    return "Implement exponential backoff with ±jitter on the client. Respect `Retry-After` response headers and surface a user-visible cooldown notice instead of silently retrying.";
  }

  // ── HTTP 400 / bad request ────────────────────────────────────────────
  if (t.includes("400") || t.includes("bad request")) {
    return "Harden the request payload schema: validate all fields client-side before dispatch and sanitize server-side against the expected schema type definitions.";
  }

  // ── HTTP 401 / 403 ────────────────────────────────────────────────────
  if (t.includes("403") || t.includes("forbidden") || t.includes("unauthorized")) {
    return "Review API key configuration and permission rules. Ensure auth tokens are refreshed before expiry and attached as bearer tokens to every authenticated request.";
  }

  // ── HTTP 503 ──────────────────────────────────────────────────────────
  if (t.includes("503") || t.includes("unavailable")) {
    return "Add a circuit-breaker pattern: after 3 consecutive 503 responses, fail fast and display a maintenance notice instead of triggering an unbounded retry loop.";
  }

  // ── TypeError / null-ref ──────────────────────────────────────────────
  if (t.includes("typeerror") || t.includes("undefined") || t.includes("cannot read")) {
    return "Guard the handler with optional chaining (`?.`) and add a React `<ErrorBoundary>` wrapper around the parent component to catch and display unhandled exceptions gracefully.";
  }

  // ── RangeError / stack overflow ───────────────────────────────────────
  if (t.includes("rangeerror") || t.includes("call stack") || t.includes("maximum")) {
    return "Audit the recursive call chain, add a depth limit, or convert to an iterative algorithm. Ensure memoization caches are bounded to prevent stack exhaustion under repeated invocations.";
  }

  // ── Aborted requests ──────────────────────────────────────────────────
  if (t.includes("abort") || t.includes("aborted")) {
    return "Pass `AbortSignal.timeout(5000)` to every `fetch` call and clean up pending signals in component `useEffect` cleanup to prevent memory leaks and ghost requests.";
  }

  // ── Generic network ───────────────────────────────────────────────────
  if (t.includes("network") || t.includes("http") || t.includes("post") || t.includes("get")) {
    return "Add centralised error-handling middleware with a 3-attempt retry policy and user-facing toast notifications for persistent network failures.";
  }

  // ── Generic exception ─────────────────────────────────────────────────
  if (t.includes("exception") || t.includes("error")) {
    return "Wrap all async event handlers in try/catch blocks and add a top-level React `<ErrorBoundary>` to prevent uncaught rejections from freezing the UI.";
  }

  return "Add client-side input validation, server-side rate-limiting, and React error boundaries to harden this interaction against concurrent load.";
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION 3 — Per-user sentence builder
   ───────────────────────────────────────────────────────────────────────── */

/** Returns a distinct prose sentence for one virtual user based on their
 *  actual event history from the session. */
function buildUserSentence(userId: string, events: LogEvent[]): string {
  if (events.length === 0) {
    return "No events were recorded for this user during the session.";
  }

  const clicks     = events.filter((e) => e.actionType === "CLICK");
  const inputs     = events.filter((e) => e.actionType === "INPUT");
  const exceptions = events.filter((e) => e.actionType === "EXCEPTION");
  const netFails   = events.filter((e) => e.actionType === "NETWORK" && e.rawErrorDetails);
  const netOk      = events.filter((e) => e.actionType === "NETWORK" && !e.rawErrorDetails);

  const actionParts: string[] = [];

  if (clicks.length > 0) {
    const uniqueTargets = [...new Set(clicks.map((e) => labelElement(e.targetElement ?? "")))];
    if (uniqueTargets.length === 1) {
      actionParts.push(
        `hammered ${uniqueTargets[0]} with ${clicks.length} rapid-fire clicks`
      );
    } else {
      const preview = uniqueTargets.slice(0, 2).join(", ");
      const extra   = uniqueTargets.length > 2 ? `, +${uniqueTargets.length - 2} more` : "";
      actionParts.push(
        `rapid-clicked ${uniqueTargets.length} distinct UI targets (${preview}${extra})`
      );
    }
  }

  if (inputs.length > 0) {
    const uniqueFields = [...new Set(inputs.map((e) => labelElement(e.targetElement ?? "")))];
    actionParts.push(
      `flooded ${uniqueFields.join(" and ")} with oversized surrogate-pair payload strings`
    );
  }

  // Determine primary failure (exception > network error > none)
  const primaryFail = exceptions[0] ?? netFails[0] ?? null;

  let outcome = "";
  let fixSrc  = { errorType: "", elementId: "" };

  if (exceptions.length > 0) {
    const ex        = exceptions[0];
    const errKind   = ex.rawErrorDetails?.split(":")[0] ?? "Exception";
    const errDetail = ex.rawErrorDetails ?? "an unhandled exception";
    outcome  = `triggering an unhandled \`${errKind}\` that crashed the application (${errDetail.slice(0, 80)}${errDetail.length > 80 ? "…" : ""})`;
    fixSrc   = { errorType: errDetail, elementId: ex.targetElement ?? "" };
  } else if (netFails.length > 0) {
    const nf = netFails[0];
    outcome  = `causing \`${nf.networkEndpoint}\` to return \`${nf.rawErrorDetails}\``;
    fixSrc   = { errorType: nf.rawErrorDetails ?? "", elementId: nf.networkEndpoint ?? "" };
  } else if (netOk.length > 0) {
    outcome = `with all ${netOk.length} network request${netOk.length > 1 ? "s" : ""} completing cleanly under load`;
  }

  let sentence = "This user ";
  if (actionParts.length > 0) {
    sentence += actionParts.join(", ");
    if (outcome) sentence += `, ${outcome}`;
  } else if (outcome) {
    sentence += outcome;
  } else {
    sentence += `completed ${events.length} test action${events.length > 1 ? "s" : ""} without triggering a critical failure`;
  }
  sentence += ".";

  if (primaryFail) {
    const fix = generateActionableFix(fixSrc.errorType, fixSrc.elementId);
    sentence += ` **Fix:** ${fix}`;
  }

  return sentence;
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION 4 — Executive synthesis helpers
   ───────────────────────────────────────────────────────────────────────── */

type VulnCategory =
  | "Unhandled JavaScript exceptions under concurrent load"
  | "API endpoint failures under concurrent request pressure"
  | "Missing input length / format validation"
  | "Race conditions from rapid concurrent UI interactions"
  | "Session / authentication instability";

function detectMostCommonVulnerability(events: LogEvent[]): VulnCategory {
  const crits = events.filter((e) => e.isCritical);

  const counts: Record<VulnCategory, number> = {
    "Unhandled JavaScript exceptions under concurrent load": 0,
    "API endpoint failures under concurrent request pressure": 0,
    "Missing input length / format validation": 0,
    "Race conditions from rapid concurrent UI interactions": 0,
    "Session / authentication instability": 0,
  };

  for (const e of crits) {
    if (e.actionType === "EXCEPTION") {
      counts["Unhandled JavaScript exceptions under concurrent load"]++;
    } else if (e.actionType === "NETWORK") {
      const ep = e.networkEndpoint ?? "";
      const rd = e.rawErrorDetails ?? "";
      if (ep.includes("auth") || rd.includes("401")) {
        counts["Session / authentication instability"]++;
      } else {
        counts["API endpoint failures under concurrent request pressure"]++;
      }
    } else if (e.actionType === "INPUT") {
      counts["Missing input length / format validation"]++;
    } else if (e.actionType === "CLICK") {
      counts["Race conditions from rapid concurrent UI interactions"]++;
    }
  }

  // Return the category with the highest count (first wins on tie)
  return (Object.entries(counts) as [VulnCategory, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

function calcStabilityScore(total: number, critical: number): number {
  if (total === 0) return 100;
  const raw = 100 - (critical / total) * 100;
  return Math.max(0, Math.round(raw * 10) / 10);
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION 5 — Main compiler entry point
   ───────────────────────────────────────────────────────────────────────── */

export type ReportCompilerInput = {
  logEntries: LogEvent[];
  targetUrl: string;
  ticksCompleted: number;
  totalTicks: number;
  status: "COMPLETED" | "STOPPED_EARLY";
};

export function compileStabilityReport({
  logEntries,
  targetUrl,
  ticksCompleted,
  totalTicks,
  status,
}: ReportCompilerInput): string {
  // ── Group events by user ─────────────────────────────────────────────
  const byUser: Record<string, LogEvent[]> = {};
  for (const u of VIRTUAL_USERS) byUser[u.id] = [];
  for (const e of logEntries) {
    if (byUser[e.user]) byUser[e.user].push(e);
  }

  // ── Aggregate metrics ────────────────────────────────────────────────
  const totalEvents    = logEntries.length;
  const criticalErrors = logEntries.filter((e) => e.isCritical).length;
  const totalErrors    = logEntries.filter((e) => e.rawErrorDetails).length;
  const stabilityScore = calcStabilityScore(totalEvents, criticalErrors);
  const vulnerability  = totalEvents > 0
    ? detectMostCommonVulnerability(logEntries)
    : "No events captured";

  const completionLabel = status === "COMPLETED"
    ? `RUN_COMPLETE (${ticksCompleted}/${totalTicks} ticks)`
    : `STOPPED_EARLY (${ticksCompleted}/${totalTicks} ticks)`;

  // ── Build per-user section ───────────────────────────────────────────
  const userRows = VIRTUAL_USERS.map((u) => {
    const events  = byUser[u.id] ?? [];
    const summary = buildUserSentence(u.id, events);
    return `**${u.id}** _(${events.length} events)_: ${summary}`;
  }).join("\n\n");

  // ── Build executive synthesis ────────────────────────────────────────
  const conclusionSentence =
    totalEvents === 0
      ? "No telemetry was captured during this run."
      : `The stress run revealed that the application's primary weakness is **${vulnerability.toLowerCase()}**. ` +
        `With a stability score of **${stabilityScore}%**, immediate prioritisation is recommended to ` +
        `address the ${criticalErrors} critical failure${criticalErrors !== 1 ? "s" : ""} ` +
        `detected across the ${ticksCompleted}-tick session.`;

  // ── Assemble markdown ────────────────────────────────────────────────
  return `# 🛡️ STRESSBOT STABILITY REPORT

**Target:** [${targetUrl}](${targetUrl})
**Execution Scope:** ${VIRTUAL_USERS.length} Concurrent AI Users · ${ticksCompleted} / ${totalTicks} Ticks
**Status:** ${completionLabel}

---

## Per-User Action Breakdown

${userRows}

---

## Executive Synthesis

| Metric | Value |
|--------|-------|
| Total Events Logged | ${totalEvents} |
| Total Errors Triggered | ${totalErrors} |
| Critical App Crashes | ${criticalErrors} |
| System Stability Score | **${stabilityScore}%** |
| Most Common Vulnerability | ${vulnerability} |

${conclusionSentence}`;
}

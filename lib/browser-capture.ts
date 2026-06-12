import type { Page } from "playwright";
import type { PageEvidence } from "@/lib/page-analysis";

export function normalizeUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const localTarget = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    trimmed
  );
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : localTarget
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function compact(items: string[]) {
  return Array.from(
    new Set(
      items
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter(Boolean)
    )
  ).slice(0, 28);
}

function detectAuthChallenge({
  finalUrl,
  title,
  headings,
  buttons,
  forms,
  visibleText,
  passwordFieldCount,
}: {
  finalUrl: string;
  title: string;
  headings: string[];
  buttons: string[];
  forms: string[];
  visibleText: string;
  passwordFieldCount: number;
}) {
  const urlPath = (() => {
    try {
      return new URL(finalUrl).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();
  const compactText = [
    title,
    headings.join(" "),
    buttons.join(" "),
    forms.join(" "),
    visibleText.slice(0, 1200),
  ]
    .join(" ")
    .toLowerCase();

  const authRoute = /\/(login|log-in|signin|sign-in|auth|session|account\/login)(\/|$)/i.test(
    urlPath
  );
  const authAction =
    /\b(sign in|sign-in|log in|log-in|login|continue with google|continue with github|forgot password|two-factor|verification code|magic link)\b/i.test(
      compactText
    );
  const hasCredentialForm =
    passwordFieldCount > 0 ||
    forms.some((form) => /password|email|username|one-time|otp|verification/i.test(form));

  if (passwordFieldCount > 0) {
    return { detected: true, reason: "Password field detected on the captured page." };
  }
  if (authRoute && (authAction || hasCredentialForm)) {
    return {
      detected: true,
      reason: "The target redirected to an authentication route.",
    };
  }
  if (authAction && hasCredentialForm) {
    return {
      detected: true,
      reason: "The page appears to require sign-in before the product can be tested.",
    };
  }

  return undefined;
}

export async function capturePageEvidence({
  page,
  requestedUrl,
  consoleErrors,
  networkErrors,
}: {
  page: Page;
  requestedUrl: string;
  consoleErrors: string[];
  networkErrors: string[];
}): Promise<PageEvidence> {
  await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => {});

  const pageData = await page.evaluate(() => {
    const textOf = (selector: string) =>
      Array.from(document.querySelectorAll(selector))
        .map((element) => element.textContent ?? "")
        .map((text) => text.replace(/\s+/g, " ").trim())
        .filter(Boolean);

    const controls = Array.from(
      document.querySelectorAll("button, [role='button'], input[type='submit']")
    )
      .map((element) => {
        if (element instanceof HTMLInputElement) return element.value;
        return element.textContent ?? element.getAttribute("aria-label") ?? "";
      })
      .map((text) => text.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const links = Array.from(document.querySelectorAll("a"))
      .map((element) => ({
        text: (element.textContent ?? element.getAttribute("aria-label") ?? "")
          .replace(/\s+/g, " ")
          .trim(),
        href: element.href,
      }))
      .filter((link) => link.text || link.href);

    const forms = Array.from(
      document.querySelectorAll("input, textarea, select, label")
    )
      .map((element) => {
        const label = element.getAttribute("aria-label");
        const placeholder = element.getAttribute("placeholder");
        const name = element.getAttribute("name");
        const text = element.textContent;
        return label ?? placeholder ?? name ?? text ?? "";
      })
      .map((text) => text.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const description =
      document
        .querySelector("meta[name='description']")
        ?.getAttribute("content") ?? "";

    const passwordFieldCount = document.querySelectorAll(
      "input[type='password']"
    ).length;

    return {
      title: document.title,
      description,
      headings: textOf("h1, h2, h3"),
      buttons: controls,
      links: links.map((link) => link.text || link.href),
      linkTargets: links.map((link) => link.href).filter(Boolean),
      forms,
      passwordFieldCount,
      visibleText: (document.body?.innerText ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000),
    };
  });

  const screenshotBuffer = await page.screenshot({
    type: "jpeg",
    quality: 64,
    fullPage: false,
  });
  const initialFinalUrl = page.url();
  const visitedPages = await captureLinkedPages({
    page,
    currentUrl: initialFinalUrl,
    targets: pageData.linkTargets,
  });

  return {
    url: requestedUrl,
    finalUrl: initialFinalUrl,
    title: pageData.title,
    description: pageData.description,
    headings: compact(pageData.headings),
    buttons: compact(pageData.buttons),
    links: compact(pageData.links),
    forms: compact(pageData.forms),
    visitedPages,
    visibleText: pageData.visibleText,
    screenshot: `data:image/jpeg;base64,${screenshotBuffer.toString("base64")}`,
    consoleErrors: compact(consoleErrors),
    networkErrors: compact(networkErrors),
    authChallenge: detectAuthChallenge({
      finalUrl: initialFinalUrl,
      title: pageData.title,
      headings: pageData.headings,
      buttons: pageData.buttons,
      forms: pageData.forms,
      visibleText: pageData.visibleText,
      passwordFieldCount: pageData.passwordFieldCount,
    }),
  };
}

async function captureLinkedPages({
  page,
  currentUrl,
  targets,
}: {
  page: Page;
  currentUrl: string;
  targets: string[];
}) {
  let origin: string;
  try {
    origin = new URL(currentUrl).origin;
  } catch {
    return [];
  }
  const blocked = /logout|log-out|signout|sign-out|delete|remove|unsubscribe/i;
  const urls = Array.from(
    new Set(
      targets
        .map((target) => {
          try {
            return new URL(target, currentUrl);
          } catch {
            return null;
          }
        })
        .filter((url): url is URL => Boolean(url))
        .filter((url) => url.origin === origin)
        .filter((url) => !blocked.test(url.pathname + url.search))
        .map((url) => url.toString())
        .filter((url) => url !== currentUrl)
    )
  ).slice(0, 3);

  const visitedPages = [];

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 6_000 });
      await page.waitForLoadState("networkidle", { timeout: 1_500 }).catch(() => {});
      const data = await page.evaluate(() => {
        const textOf = (selector: string) =>
          Array.from(document.querySelectorAll(selector))
            .map((element) => element.textContent ?? "")
            .map((text) => text.replace(/\s+/g, " ").trim())
            .filter(Boolean);

        const controls = Array.from(
          document.querySelectorAll("button, [role='button'], input[type='submit']")
        )
          .map((element) => {
            if (element instanceof HTMLInputElement) return element.value;
            return element.textContent ?? element.getAttribute("aria-label") ?? "";
          })
          .map((text) => text.replace(/\s+/g, " ").trim())
          .filter(Boolean);

        const forms = Array.from(
          document.querySelectorAll("input, textarea, select, label")
        )
          .map((element) => {
            const label = element.getAttribute("aria-label");
            const placeholder = element.getAttribute("placeholder");
            const name = element.getAttribute("name");
            const text = element.textContent;
            return label ?? placeholder ?? name ?? text ?? "";
          })
          .map((text) => text.replace(/\s+/g, " ").trim())
          .filter(Boolean);

        return {
          title: document.title,
          headings: textOf("h1, h2, h3"),
          buttons: controls,
          forms,
        };
      });

      visitedPages.push({
        url: page.url(),
        title: data.title,
        headings: compact(data.headings).slice(0, 8),
        buttons: compact(data.buttons).slice(0, 8),
        forms: compact(data.forms).slice(0, 8),
      });
    } catch {
      // Some routes block automation or require interactions. The primary page still carries the report.
    }
  }

  await page.goto(currentUrl, { waitUntil: "domcontentloaded", timeout: 6_000 }).catch(() => {});
  return visitedPages;
}

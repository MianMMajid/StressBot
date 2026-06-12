import { chromium } from "playwright";
import {
  PageEvidence,
  analyzeEvidence,
  buildFallbackAnalysis,
} from "@/lib/page-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeUrl(value: unknown) {
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

function compact(items: string[]) {
  return Array.from(
    new Set(
      items
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter(Boolean)
    )
  ).slice(0, 28);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = normalizeUrl((body as { url?: unknown }).url);
  if (!url) {
    return Response.json({ error: "A valid http(s) URL is required" }, { status: 400 });
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1365, height: 900 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 SimsAiLocal/1.0",
    });

    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("requestfailed", (requestFailed) => {
      networkErrors.push(
        `${requestFailed.method()} ${requestFailed.url()} ${
          requestFailed.failure()?.errorText ?? "failed"
        }`
      );
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 18_000,
    });
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
        .map((element) => element.textContent ?? element.getAttribute("aria-label") ?? "")
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

      const description =
        document
          .querySelector("meta[name='description']")
          ?.getAttribute("content") ?? "";

      return {
        title: document.title,
        description,
        headings: textOf("h1, h2, h3"),
        buttons: controls,
        links,
        forms,
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

    const evidence: PageEvidence = {
      url,
      finalUrl: page.url(),
      title: pageData.title,
      description: pageData.description,
      headings: compact(pageData.headings),
      buttons: compact(pageData.buttons),
      links: compact(pageData.links),
      forms: compact(pageData.forms),
      visibleText: pageData.visibleText,
      screenshot: `data:image/jpeg;base64,${screenshotBuffer.toString("base64")}`,
      consoleErrors: compact(consoleErrors),
      networkErrors: compact(networkErrors),
    };

    return Response.json(analyzeEvidence(evidence));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown browser error";
    return Response.json(buildFallbackAnalysis(url, message), { status: 200 });
  } finally {
    await browser?.close();
  }
}

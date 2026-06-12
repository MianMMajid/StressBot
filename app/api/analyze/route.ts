import { chromium } from "playwright";
import {
  analyzeEvidence,
  buildFallbackAnalysis,
} from "@/lib/page-analysis";
import { capturePageEvidence, normalizeUrl } from "@/lib/browser-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const evidence = await capturePageEvidence({
      page,
      requestedUrl: url,
      consoleErrors,
      networkErrors,
    });
    return Response.json(analyzeEvidence(evidence));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown browser error";
    return Response.json(buildFallbackAnalysis(url, message), { status: 200 });
  } finally {
    await browser?.close();
  }
}

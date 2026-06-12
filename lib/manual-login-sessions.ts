import { chromium, type Browser, type Page } from "playwright";
import { analyzeEvidence } from "@/lib/page-analysis";
import { capturePageEvidence } from "@/lib/browser-capture";

interface ManualLoginSession {
  browser: Browser;
  page: Page;
  requestedUrl: string;
  consoleErrors: string[];
  networkErrors: string[];
  createdAt: number;
}

const SESSION_TTL_MS = 10 * 60 * 1000;

const globalSessions = globalThis as typeof globalThis & {
  __SIMSAI_MANUAL_LOGIN_SESSIONS__?: Map<string, ManualLoginSession>;
};

function sessions() {
  if (!globalSessions.__SIMSAI_MANUAL_LOGIN_SESSIONS__) {
    globalSessions.__SIMSAI_MANUAL_LOGIN_SESSIONS__ = new Map();
  }
  return globalSessions.__SIMSAI_MANUAL_LOGIN_SESSIONS__;
}

async function cleanupExpiredSessions() {
  const now = Date.now();
  await Promise.all(
    Array.from(sessions().entries()).map(async ([id, session]) => {
      if (now - session.createdAt < SESSION_TTL_MS) return;
      sessions().delete(id);
      await session.browser.close().catch(() => {});
    })
  );
}

export async function startManualLoginSession(url: string) {
  await cleanupExpiredSessions();

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({
    viewport: { width: 1365, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 SimsAiManualLogin/1.0",
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

  const sessionId = crypto.randomUUID();
  sessions().set(sessionId, {
    browser,
    page,
    requestedUrl: url,
    consoleErrors,
    networkErrors,
    createdAt: Date.now(),
  });

  return {
    sessionId,
    currentUrl: page.url(),
  };
}

export async function captureManualLoginSession(sessionId: string) {
  const session = sessions().get(sessionId);
  if (!session) {
    throw new Error("Manual login session expired or was not found");
  }

  try {
    const evidence = await capturePageEvidence({
      page: session.page,
      requestedUrl: session.requestedUrl,
      consoleErrors: session.consoleErrors,
      networkErrors: session.networkErrors,
    });
    return analyzeEvidence(evidence);
  } finally {
    sessions().delete(sessionId);
    await session.browser.close().catch(() => {});
  }
}

export async function cancelManualLoginSession(sessionId: string) {
  const session = sessions().get(sessionId);
  if (!session) return;

  sessions().delete(sessionId);
  await session.browser.close().catch(() => {});
}

import { normalizeUrl } from "@/lib/browser-capture";
import { startManualLoginSession } from "@/lib/manual-login-sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canOpenHeadedBrowser() {
  if (
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_SERVICE_ID
  ) {
    return false;
  }

  return process.platform !== "linux" || Boolean(process.env.DISPLAY);
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

  if (!canOpenHeadedBrowser()) {
    return Response.json(
      {
        error:
          "Manual login requires a local desktop browser. The hosted Railway demo can review public pages, but authenticated login handoff must be run locally.",
      },
      { status: 409 }
    );
  }

  try {
    const session = await startManualLoginSession(url);
    return Response.json({
      ...session,
      message:
        "A browser window is open. Log in there, then return to SimsAi and continue.",
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not open manual login browser",
      },
      { status: 500 }
    );
  }
}

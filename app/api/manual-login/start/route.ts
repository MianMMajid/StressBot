import { normalizeUrl } from "@/lib/browser-capture";
import { startManualLoginSession } from "@/lib/manual-login-sessions";

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

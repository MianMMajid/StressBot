import { captureManualLoginSession } from "@/lib/manual-login-sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = (body as { sessionId?: unknown }).sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    return Response.json({ error: "Manual login session id is required" }, { status: 400 });
  }

  try {
    return Response.json(await captureManualLoginSession(sessionId));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not capture manual login session",
      },
      { status: 404 }
    );
  }
}

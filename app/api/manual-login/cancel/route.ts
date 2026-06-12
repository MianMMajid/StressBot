import { cancelManualLoginSession } from "@/lib/manual-login-sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { sessionId?: unknown }
    | null;
  const sessionId = body?.sessionId;

  if (typeof sessionId === "string" && sessionId) {
    await cancelManualLoginSession(sessionId);
  }

  return Response.json({ ok: true });
}

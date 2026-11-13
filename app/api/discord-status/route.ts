import { getDiscordPresence } from "../../../lib/discord-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getDiscordPresence();
    const status = result.body.status;
    if (result.statusCode === 200 && status !== "online" && status !== "idle" && status !== "dnd" && status !== "offline") {
      throw new Error("Invalid Discord status");
    }
    return Response.json({ status }, { status: result.statusCode, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unknown" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
import { type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { clavePrevia, htmlPrevia } from "@/lib/ig-semana";

export const dynamic = "force-dynamic";

// Vista previa de Instagram en vivo (16-11-2026). Va en el mensaje del domingo a Telegram con su clave (?k=), que sale de CRON_SECRET.
export async function GET(req: NextRequest) {
  if (!mismaClave(req.nextUrl.searchParams.get("k"), clavePrevia())) return new Response("no autorizado", { status: 401 });
  return new Response(await htmlPrevia(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}

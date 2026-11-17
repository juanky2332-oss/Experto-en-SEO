import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { blogDelDia } from "@/lib/que-publicar/plan-blog";

export const maxDuration = 300;

// Calendario del blog (17-11-2026): lo llama n8n los martes y viernes por la mañana (y un reintento a mediodía).
// Publica el artículo del día de la lista aprobada; al lanzar el último, manda por Telegram la lista siguiente.
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!mismaClave(bearer, process.env.CRON_SECRET) && !mismaClave(req.headers.get("x-seo-key"), process.env.SEO_GATEWAY_KEY)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, resultado: await blogDelDia() });
}

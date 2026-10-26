import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { mediodia, tarde } from "@/lib/instagram-diario";

export const maxDuration = 300;

// Instagram en automático. Lo llama n8n (flujo «INSTAGRAM DIARIO», L-V) con la cabecera X-Seo-Key, o a mano con Bearer CRON_SECRET.
// 13:00 → reel del plan + responder comentarios + informe · ?fase=tarde (19:00) → lista al móvil de lo que el PC no haya hecho
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!mismaClave(bearer, process.env.CRON_SECRET) && !mismaClave(req.headers.get("x-seo-key"), process.env.SEO_GATEWAY_KEY)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const r = req.nextUrl.searchParams.get("fase") === "tarde" ? await tarde() : await mediodia();
  return NextResponse.json(r);
}

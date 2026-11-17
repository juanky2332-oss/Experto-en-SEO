import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { estadisticas } from "@/lib/ig-estadisticas";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Estadísticas de Instagram para el Radar de Tiendas (17-11-2026). Clave: x-ig-key (la del Radar), o la del cron.
// ?refrescar=1 baja todo de Instagram ya (n8n lo hace cada noche para fotografiar las historias antes de que caduquen).
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const ok = mismaClave(req.headers.get("x-ig-key"), process.env.RADAR_IG_KEY) || mismaClave(bearer, process.env.CRON_SECRET) || mismaClave(req.headers.get("x-seo-key"), process.env.SEO_GATEWAY_KEY);
  if (!ok) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await estadisticas(req.nextUrl.searchParams.get("refrescar") === "1"));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

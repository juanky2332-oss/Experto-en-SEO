import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// La guía de contenido de Instagram y las decisiones de la semana, para el Radar (18-11-2026).
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const ok = mismaClave(req.headers.get("x-ig-key"), process.env.RADAR_IG_KEY) || mismaClave(bearer, process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const filas = await sql<{ key: string; value: unknown }[]>`select key, value from seo.settings where key in ('ig_guia', 'ig_decisiones', 'ig_aprendizaje')`;
  const v = Object.fromEntries(filas.map((f) => [f.key, f.value]));
  return NextResponse.json({ guia: v.ig_guia ?? null, decisiones: v.ig_decisiones ?? null, aprendizaje: v.ig_aprendizaje ?? null });
}

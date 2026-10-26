import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { articulo, compartir, compartirNuevos } from "@/lib/redes";

// Lleva noticias del blog a Instagram. Bearer CRON_SECRET.
// POST {}            → propone por Telegram las publicadas en los últimos 3 días que aún no se han llevado
// POST { id: 1234 }  → propone ese artículo (salvo que ya esté subido)
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!mismaClave(auth, process.env.CRON_SECRET)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const base = new URL(req.url).origin;
  const body = (await req.json().catch(() => ({}))) as { id?: number };
  if (body.id) {
    const a = await articulo(Number(body.id));
    if (!a) return NextResponse.json({ error: "no existe" }, { status: 404 });
    return NextResponse.json({ ok: true, resultado: [await compartir(a, base)] });
  }
  return NextResponse.json({ ok: true, resultado: await compartirNuevos(base) });
}

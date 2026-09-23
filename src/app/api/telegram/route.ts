import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { atender } from "@/lib/telegram";

export const maxDuration = 120;

// n8n (Publicador v3) reenvía aquí todo mensaje o botón de Telegram que no sea del flujo de publicación.
export async function POST(req: NextRequest) {
  if (!mismaClave(req.headers.get("x-seo-key"), process.env.SEO_GATEWAY_KEY)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const update = await req.json().catch(() => null);
  if (!update) return NextResponse.json({ error: "cuerpo inválido" }, { status: 400 });
  const r = await atender(update);
  return NextResponse.json({ ok: true, respondido: !!r });
}

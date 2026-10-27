import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { ensayar } from "@/lib/redes";

// Ensayo del control de calidad de Instagram (no publica nada). Bearer CRON_SECRET. ?id=<id de la cola> (por defecto, la siguiente del feed).
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!mismaClave(auth, process.env.CRON_SECRET)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  return NextResponse.json(await ensayar(req.nextUrl.searchParams.get("id") ?? undefined));
}

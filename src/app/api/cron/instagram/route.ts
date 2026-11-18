import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { mediodia, tarde, historias, reelNoche } from "@/lib/instagram-diario";
import { programaSemana } from "@/lib/ig-semana";

export const maxDuration = 300;

// Instagram en automático. Lo llama n8n (flujo «INSTAGRAM DIARIO», L-V) con la cabecera X-Seo-Key, o a mano con Bearer CRON_SECRET.
// ?fase=semana (domingo 18:00) → programa de la semana siguiente a Telegram, con aviso si falta contenido
// 13:00 → responder comentarios + informe · ?fase=reel (21:00 y 21:30) → reel del plan · ?fase=historias (20:30) → historias del día · ?fase=tarde (19:00) → lista al móvil de lo que el PC no haya hecho
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!mismaClave(bearer, process.env.CRON_SECRET) && !mismaClave(req.headers.get("x-seo-key"), process.env.SEO_GATEWAY_KEY)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const fase = req.nextUrl.searchParams.get("fase");
  // ?fase=resumen → el resumen semanal que aprende (lo manda el domingo con el programa); aquí solo lo devuelve, para probarlo
  // ?fase=noticia&prueba=1 → qué noticia saldría hoy en las historias y cómo quedaría (sin guardar ni avisar)
  if (fase === "noticia") { const { noticiaDelDia } = await import("@/lib/ig-noticia"); return NextResponse.json(await noticiaDelDia({ prueba: req.nextUrl.searchParams.get("prueba") === "1" })); }
  if (fase === "resumen") { const { resumenSemanal } = await import("@/lib/ig-aprende"); return NextResponse.json(await resumenSemanal(undefined, false)); } // prueba: no guarda nada
  const r = fase === "semana" ? await programaSemana() : fase === "tarde" ? await tarde() : fase === "historias" ? await historias() : fase === "reel" ? await reelNoche() : await mediodia();
  return NextResponse.json(r);
}

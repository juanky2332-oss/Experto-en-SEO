import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { inventario, guardarFoto } from "@/lib/seo/inventario";
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";

export const maxDuration = 300;

// Vercel Cron (vercel.json): foto SEO diaria + aviso si algo ha empeorado.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!mismaClave(auth, process.env.CRON_SECRET)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const inv = await inventario();
  const [ayer] = await sql<{ score: number }[]>`select score from seo.score_history where post_id = 0 and fecha < current_date order by fecha desc limit 1`;
  const antes = new Map((await sql<{ post_id: number; score: number }[]>`select post_id, score from seo.post_scores`).map((r) => [r.post_id, r.score]));
  await guardarFoto(inv);
  const caidas = inv.posts.filter((p) => p.status === "publish" && antes.has(p.id) && antes.get(p.id)! - p.analisis.score >= 10);
  const criticos = inv.posts.filter((p) => p.status === "publish" && p.analisis.problemas.some((x) => x.codigo === "enlaces_rotos" || x.codigo === "anio_erroneo"));
  const lunes = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/Madrid", weekday: "long" }) === "Monday";
  if (caidas.length || lunes) {
    const delta = ayer ? inv.salud - ayer.score : 0;
    await telegram(
      `📈 <b>${lunes ? "Informe semanal SEO" : "Aviso SEO"}</b>\nSalud media: <b>${inv.salud}/100</b>${ayer ? ` (${delta >= 0 ? "+" : ""}${delta})` : ""}\n` +
        (caidas.length ? `\n⬇️ Han empeorado:\n${caidas.slice(0, 5).map((p) => `• ${esc(p.title)} → ${p.analisis.score} (/post ${p.id})`).join("\n")}\n` : "") +
        (criticos.length ? `\n⚠️ ${criticos.length} artículos con enlaces rotos o años erróneos (/articulos)\n` : "") +
        `\n${process.env.APP_URL ?? ""}`,
    );
  }
  return NextResponse.json({ ok: true, salud: inv.salud, caidas: caidas.length });
}

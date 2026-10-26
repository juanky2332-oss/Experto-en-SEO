import "server-only";
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";
import { subir } from "@/lib/redes";
import { json, MODELO_RAPIDO } from "@/lib/ai";

// Instagram en automático (decidido el 26-10-2026: «hazlo tú y dame el informe después»).
// 13:00 (cron de Vercel): el servidor publica el reel del plan, responde a los comentarios de nuestras publicaciones
//   y manda el informe (los lunes con números de la semana, los viernes con posibles clientes).
// Seguir y comentar en otras cuentas no se puede por la API: lo hace el agente local (Claude + Chrome) si el PC está
//   encendido; si a las 19:00 sigue pendiente (n8n llama a ?fase=tarde), se le manda la lista al móvil.

const IG = "https://graph.instagram.com/v21.0";
const NOSOTROS = "transformaconia.oficial";
const hoy = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const diaSemana = () => new Date().toLocaleDateString("en-GB", { timeZone: "Europe/Madrid", weekday: "long" });

type Cred = { token: string; user_id: string };
async function cred(): Promise<Cred | null> {
  const [r] = await sql<{ value: Cred }[]>`select value from seo.settings where key = 'ig_token'`;
  return r?.value?.token ? r.value : null;
}
const ig = async <T>(c: Cred, path: string) => (await fetch(`${IG}/${path}${path.includes("?") ? "&" : "?"}access_token=${c.token}`)).json() as Promise<T>;

async function enTrozos(cabecera: string, bloques: string[]) {
  let actual = cabecera;
  for (const b of bloques) {
    if (actual.length + b.length + 2 > 3800) {
      await telegram(actual);
      actual = "";
    }
    actual += (actual ? "\n\n" : "") + b.slice(0, 3800);
  }
  if (actual) await telegram(actual);
}

// ---------------------------------------------------------------- responder comentarios
type Comentario = { id: string; text: string; username: string; timestamp?: string; replies?: { data: { username: string }[] } };
const MAX_RESPUESTAS = 10;

async function responderComentarios(c: Cred) {
  const media = await ig<{ data?: { id: string; caption?: string }[] }>(c, `${c.user_id}/media?fields=id,caption&limit=20`);
  const hechas: string[] = [];
  const ignorados: string[] = [];
  const limite = Date.now() - 14 * 86400_000;
  for (const m of media.data ?? []) {
    if (hechas.length + ignorados.length >= MAX_RESPUESTAS) break;
    const cs = await ig<{ data?: Comentario[] }>(c, `${m.id}/comments?fields=id,text,username,timestamp,replies{username}&limit=50`);
    for (const x of cs.data ?? []) {
      if (hechas.length + ignorados.length >= MAX_RESPUESTAS) break;
      if (x.username === NOSOTROS || (x.replies?.data ?? []).some((r) => r.username === NOSOTROS)) continue;
      if (x.timestamp && Date.parse(x.timestamp) < limite) continue;
      // reserva atómica (índice único): si otra ejecución ya lo tiene, se salta
      const [mio] = await sql`insert into seo.ig_acciones (tipo, cuenta, url, texto, fecha) values ('responder', ${x.username}, ${x.id}, '(en curso)', ${hoy()})
        on conflict (url) where tipo = 'responder' do nothing returning id`;
      if (!mio) continue;
      const d = await json<{ responder: boolean; texto: string; motivo: string }>({
        nombre: "respuesta_instagram",
        modelo: MODELO_RAPIDO,
        sistema:
          "Respondes comentarios en el Instagram de Transforma con IA, un equipo de Murcia que lleva la IA y la automatización a talleres, industria y pymes (programa de gestión IndunexIA, automatizaciones y asistentes a medida). " +
          "Español de España, formal y cercano, 1-2 frases, sin emojis o como mucho uno. No repitas lo que dice la publicación ni el comentario: aporta una idea, un matiz o un dato práctico que haga que merezca la pena leer la respuesta. Nada de fórmulas genéricas («¡Gracias por tu comentario!») ni tono publicitario. Contesta lo que pregunten. Si preguntan precio, cómo funciona o si les sirve, invita a pedir el diagnóstico gratis en transformaconia.com («te lo enviamos por escrito»). " +
          "Nunca inventes datos, clientes ni plazos; nunca nombres herramientas internas. Si el comentario es spam, ofensivo, una cuenta que vende seguidores o no tiene sentido, responder=false.",
        usuario: `Publicación: ${(m.caption ?? "").slice(0, 300)}\n\nComentario de @${x.username}: ${x.text}`,
        esquema: { type: "object", additionalProperties: false, required: ["responder", "texto", "motivo"], properties: { responder: { type: "boolean" }, texto: { type: "string" }, motivo: { type: "string" } } },
        esfuerzo: "low",
        maxTokens: 2000,
      });
      if (!d.responder || !d.texto.trim()) {
        ignorados.push(`@${x.username}: «${x.text.slice(0, 60)}» (${d.motivo})`);
        await sql`update seo.ig_acciones set texto = ${"(sin responder) " + d.motivo} where id = ${mio.id}`;
        continue;
      }
      const r = await fetch(`${IG}/${x.id}/replies`, { method: "POST", body: new URLSearchParams({ message: d.texto, access_token: c.token }) });
      if (r.ok) {
        hechas.push(`@${x.username}: «${x.text.slice(0, 60)}» → «${d.texto}»`);
        await sql`update seo.ig_acciones set texto = ${d.texto} where id = ${mio.id}`;
      } else {
        await sql`delete from seo.ig_acciones where id = ${mio.id}`; // se reintenta en la próxima
      }
    }
  }
  return { hechas, ignorados };
}

// ---------------------------------------------------------------- números
async function numeros(c: Cred) {
  const p = await ig<{ followers_count?: number; media_count?: number }>(c, "me?fields=followers_count,media_count");
  const desde = Math.floor(Date.now() / 1000) - 7 * 86400;
  const ins = await ig<{ data?: { name: string; total_value?: { value: number } }[] }>(c, `${c.user_id}/insights?metric=reach,profile_views,website_clicks&period=day&metric_type=total_value&since=${desde}&until=${Math.floor(Date.now() / 1000)}`);
  const v = (n: string) => ins.data?.find((x) => x.name === n)?.total_value?.value ?? 0;
  const [web] = await sql<{ n: number }[]>`select count(*)::int n from seo.visitas where created_at > now() - interval '7 days' and evento = 'visita' and coalesce(ref,'') ilike '%instagram%'`;
  const [cont] = await sql<{ n: number }[]>`select count(*)::int n from seo.contactos where created_at > now() - interval '7 days' and not coalesce(es_prueba, false)`;
  // seguidores de hace una semana (se guarda uno por día)
  const [h] = await sql<{ value: Record<string, number> }[]>`select value from seo.settings where key = 'ig_seguidores'`;
  const hist = { ...(h?.value ?? {}), [hoy()]: p.followers_count ?? 0 };
  await sql`insert into seo.settings (key, value) values ('ig_seguidores', ${sql.json(hist)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
  const hace7 = new Date(Date.now() - 7 * 86400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const antes = Object.entries(hist).filter(([f]) => f <= hace7).sort().pop()?.[1];
  return { seguidores: p.followers_count ?? 0, nuevos: antes === undefined ? null : (p.followers_count ?? 0) - antes, alcance: v("reach"), visitasPerfil: v("profile_views"), clics: v("website_clicks"), web: web.n, contactos: cont.n };
}

// ---------------------------------------------------------------- 13:00
export async function mediodia() {
  const c = await cred();
  if (!c) return { ok: false, motivo: "Instagram no conectado" };
  const lineas: string[] = [];
  const dia = diaSemana();
  const [plan] = await sql<{ tareas: { tipo: string; ref?: string | null }[]; estado: string }[]>`select tareas, estado from seo.ig_plan where fecha = ${hoy()}`;
  let reelOk = true;
  if (plan && plan.estado !== "hecho" && plan.estado !== "rechazado") {
    const reel = plan.tareas.find((t) => t.tipo === "reel" && t.ref)?.ref;
    if (reel) {
      const r = await subir(reel);
      reelOk = r.startsWith("✅") || r.startsWith("Ya estaba subido");
      lineas.push(`🎬 ${r.split("\n\nQuedan")[0]}${reelOk ? "" : "\nLo vuelvo a intentar en la próxima pasada; si quieres, escribe /reel."}`);
    }
  }
  try {
    const r = await responderComentarios(c);
    lineas.push(r.hechas.length ? `↩️ <b>He respondido ${r.hechas.length} comentario(s):</b>\n${r.hechas.map((x) => "• " + esc(x)).join("\n")}` : "↩️ Ningún comentario nuevo que responder.");
    if (r.ignorados.length) lineas.push(`🙈 Sin responder (spam o sin sentido):\n${r.ignorados.map((x) => "• " + esc(x)).join("\n")}`);
  } catch (e) {
    lineas.push(`⚠️ No he podido revisar los comentarios: ${esc((e as Error).message)}`);
  }
  const n = await numeros(c).catch(() => null);
  if (n && (dia === "Monday" || dia === "Friday")) {
    lineas.push(`📊 <b>Últimos 7 días</b>\nSeguidores: <b>${n.seguidores}</b>${n.nuevos !== null ? ` (${n.nuevos >= 0 ? "+" : ""}${n.nuevos})` : ""} · Cuentas alcanzadas: <b>${n.alcance}</b> · Visitas al perfil: ${n.visitasPerfil} · Clics a la web: ${n.clics}\nVisitas a la web desde Instagram: ${n.web} · Contactos por la web: ${n.contactos}`);
  }
  if (dia === "Friday") {
    const quien = await sql<{ cuenta: string; n: number }[]>`select cuenta, count(*)::int n from seo.ig_acciones where tipo = 'responder' and fecha > current_date - 7 and texto not like '(sin responder)%' group by cuenta order by n desc limit 10`;
    lineas.push(quien.length ? `🎯 <b>Han hablado con nosotros esta semana:</b> ${quien.map((q) => "@" + esc(q.cuenta)).join(", ")}\nMíralos: si alguno es una empresa que encaja, dímelo y te preparo un mensaje.` : "🎯 Esta semana aún no nos ha escrito ninguna empresa. Es normal al principio: seguimos sembrando.");
  }
  // la lista de seguir/comentar se prepara mirando las publicaciones de cada cuenta (Claude + Chrome): si la semana no la tiene, se le recuerda
  const [semana] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_movil where fecha >= ${hoy()}::date and fecha < ${hoy()}::date + 5`;
  if (!semana.n && dia === "Monday") lineas.push("📝 Esta semana no tengo lista de cuentas para seguir y comentar. Cuando abras Claude Code, dime «prepara la lista de Instagram de la semana» y la dejo lista en 10 minutos.");
  const pend = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_movil where fecha = ${hoy()} and not hecho`;
  if (pend[0].n) lineas.push(`➕💬 Seguir y comentar (${pend[0].n} tareas): lo hago desde el ordenador en cuanto esté encendido. Si a las 19:00 no he podido, te llega la lista al móvil.`);
  if (plan && reelOk) await sql`update seo.ig_plan set estado = 'hecho', hecho_at = now(), informe = ${lineas.join("\n\n")} where fecha = ${hoy()} and estado not in ('hecho', 'rechazado')`;
  if (lineas.length) await enTrozos(`📲 <b>Instagram hoy</b>`, lineas);
  return { ok: true };
}

// ---------------------------------------------------------------- 19:00 (lista al móvil si el PC no lo ha hecho)
type Movil = { id: number; tipo: string; cuenta: string; url: string; texto: string | null };

export async function tarde() {
  // si el reel de mediodía falló, segundo intento
  const [plan] = await sql<{ tareas: { tipo: string; ref?: string | null }[] }[]>`select tareas from seo.ig_plan where fecha = ${hoy()} and estado not in ('hecho', 'rechazado')`;
  const reel = plan?.tareas.find((t) => t.tipo === "reel" && t.ref)?.ref;
  if (reel && (await cred())) {
    const r = await subir(reel);
    await telegram(`🎬 Segundo intento del reel: ${r.split("\n\nQuedan")[0]}`);
    if (r.startsWith("✅") || r.startsWith("Ya estaba subido")) await sql`update seo.ig_plan set estado = 'hecho', hecho_at = now() where fecha = ${hoy()}`;
  }
  const l = await sql<Movil[]>`select id, tipo, cuenta, url, texto from seo.ig_movil where fecha = ${hoy()} and not hecho
    and (reclamada_at is null or reclamada_at < now() - interval '60 minutes') order by orden`;
  if (!l.length) return { ok: true, enviados: 0 };
  const seguir = l.filter((x) => x.tipo === "seguir");
  const comentar = l.filter((x) => x.tipo === "comentar");
  const partes = [`📱 <b>Tu lista de Instagram de hoy</b> (el ordenador estaba apagado; son 5 minutos desde el móvil)`];
  if (seguir.length) partes.push(`➕ <b>Seguir</b> (toca y pulsa «Seguir»):\n${seguir.map((x) => `• <a href="${esc(x.url)}">@${esc(x.cuenta)}</a>`).join("\n")}`);
  if (comentar.length) partes.push(`💬 <b>Comentar</b> (toca el texto para copiarlo, abre la publicación y pégalo):\n\n${comentar.map((x, i) => `${i + 1}. <a href="${esc(x.url)}">@${esc(x.cuenta)}</a>\n<code>${esc(x.texto)}</code>`).join("\n\n")}`);
  const botones = [{ text: "✅ Hecho", data: `app:mvok:${hoy()}` }, { text: "Hoy no", data: `app:mvno:${hoy()}` }];
  const todo = partes.join("\n\n");
  if (todo.length <= 3900) await telegram(todo, botones);
  else {
    await enTrozos(partes[0], partes.slice(1));
    await telegram("¿Lo tienes?", botones);
  }
  return { ok: true, enviados: l.length };
}

/** «✅ Hecho» de la lista del móvil: la da por hecha y lo apunta. */
export async function movilHecho(fecha: string, hecho: boolean) {
  const l = await sql<Movil[]>`update seo.ig_movil set hecho = true where fecha = ${fecha} and not hecho
    and (reclamada_at is null or reclamada_at < now() - interval '60 minutes') returning id, tipo, cuenta, url, texto`;
  if (hecho) for (const x of l) await sql`insert into seo.ig_acciones (tipo, cuenta, url, texto, fecha) values (${x.tipo}, ${x.cuenta}, ${x.url}, ${x.texto}, ${fecha})`;
  return hecho ? `👏 Apuntado: ${l.length} tareas hechas. Mañana te cuento si alguien ha respondido.` : "De acuerdo, la de hoy la dejamos.";
}

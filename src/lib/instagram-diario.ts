import "server-only";
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";
import { subir } from "@/lib/redes";
import { json, MODELO_RAPIDO } from "@/lib/ai";
import { getRitmo, toca, proximos, bonita } from "@/lib/ritmo";

// Instagram en automático (decidido el 26-10-2026: «hazlo tú y dame el informe después»; el 27-10: cada 3 días y
// a Telegram SOLO si ha pasado algo, ver src/lib/ritmo.ts).
// 13:00 (n8n, todos los días): responde a los comentarios de nuestras publicaciones; el día que toca, además, publica el
//   reel del plan y añade números y posibles clientes. Si no ha pasado nada, no se manda nada.
// Seguir y comentar en otras cuentas no se puede por la API: lo hace el agente local (Claude + Chrome) si el PC está
//   encendido; si a las 19:00 sigue pendiente (n8n llama a ?fase=tarde), se le manda la lista al móvil.

const IG = "https://graph.instagram.com/v21.0";
const NOSOTROS = "transformaconia.oficial";
const hoy = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

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
          "Castellano de aquí, como se habla en Murcia: natural, cercano y educado, sin términos de nicho repetidos (di «empresas»), como responden las buenas cuentas de empresa: una frase (dos como mucho), concreta sobre lo que dice la persona, 0-1 emoji. Nada de fórmulas vacías («¡Gracias por tu comentario!»), ni parrafadas, ni tono publicitario. Contesta lo que pregunten. Si preguntan precio, cómo funciona o si les sirve, invita a pedir el diagnóstico gratis en transformaconia.com («te lo enviamos por escrito»). " +
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
async function numeros(c: Cred, dias: number) {
  const p = await ig<{ followers_count?: number; media_count?: number }>(c, "me?fields=followers_count,media_count");
  const desde = Math.floor(Date.now() / 1000) - dias * 86400;
  const ins = await ig<{ data?: { name: string; total_value?: { value: number } }[] }>(c, `${c.user_id}/insights?metric=reach,profile_views,website_clicks&period=day&metric_type=total_value&since=${desde}&until=${Math.floor(Date.now() / 1000)}`);
  const v = (n: string) => ins.data?.find((x) => x.name === n)?.total_value?.value ?? 0;
  const [web] = await sql<{ n: number }[]>`select count(*)::int n from seo.visitas where created_at > now() - make_interval(days => ${dias}) and evento = 'visita' and coalesce(ref,'') ilike '%instagram%'`;
  const [cont] = await sql<{ n: number }[]>`select count(*)::int n from seo.contactos where created_at > now() - make_interval(days => ${dias}) and not coalesce(es_prueba, false)`;
  // seguidores de hace `dias` días (se guarda uno por día)
  const [h] = await sql<{ value: Record<string, number> }[]>`select value from seo.settings where key = 'ig_seguidores'`;
  const hist = { ...(h?.value ?? {}), [hoy()]: p.followers_count ?? 0 };
  await sql`insert into seo.settings (key, value) values ('ig_seguidores', ${sql.json(hist)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
  const hace7 = new Date(Date.now() - dias * 86400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const antes = Object.entries(hist).filter(([f]) => f <= hace7).sort().pop()?.[1];
  return { seguidores: p.followers_count ?? 0, nuevos: antes === undefined ? null : (p.followers_count ?? 0) - antes, alcance: v("reach"), visitasPerfil: v("profile_views"), clics: v("website_clicks"), web: web.n, contactos: cont.n };
}

// ---------------------------------------------------------------- 13:00
export async function mediodia() {
  const c = await cred();
  if (!c) return { ok: false, motivo: "Instagram no conectado" };
  const ritmo = await getRitmo();
  if (ritmo.pausas.instagram) return { ok: true, pausa: true };
  const tocaHoy = toca(ritmo);
  const lineas: string[] = [];
  const [plan] = await sql<{ tareas: { tipo: string; ref?: string | null }[]; estado: string }[]>`select tareas, estado from seo.ig_plan where fecha = ${hoy()}`;
  let reelOk = true;
  // el reel solo el día que toca (por si quedara una fila vieja del plan diario)
  if (tocaHoy && plan && plan.estado !== "hecho" && plan.estado !== "rechazado") {
    const reel = plan.tareas.find((t) => t.tipo === "reel" && t.ref)?.ref;
    if (reel) {
      const r = await subir(reel);
      reelOk = r.startsWith("✅") || r.startsWith("Ya estaba subido");
      lineas.push(`🎬 ${r.split("\n\nQuedan")[0]}${reelOk ? "" : "\nLo vuelvo a intentar a las 19:00; si quieres, escribe /reel."}`);
    }
    // las historias van en su propia pasada (13:10, historias()), para no quedarse sin tiempo detrás de un reel
  }
  try {
    const r = await responderComentarios(c);
    if (r.hechas.length) {
      lineas.push(`↩️ <b>He respondido ${r.hechas.length} comentario(s):</b>\n${r.hechas.map((x) => "• " + esc(x)).join("\n")}`);
      if (r.ignorados.length) lineas.push(`🙈 Sin responder (spam o sin sentido):\n${r.ignorados.map((x) => "• " + esc(x)).join("\n")}`);
    }
  } catch (e) {
    lineas.push(`⚠️ No he podido revisar los comentarios: ${esc((e as Error).message)}`);
  }
  if (tocaHoy) {
    const n = await numeros(c, ritmo.cada).catch(() => null);
    // los números solo si se ha movido algo
    if (n && (n.nuevos || n.contactos || n.clics || n.web)) {
      lineas.push(`📊 <b>Últimos ${ritmo.cada} días</b>\nSeguidores: <b>${n.seguidores}</b>${n.nuevos !== null ? ` (${n.nuevos >= 0 ? "+" : ""}${n.nuevos})` : ""} · Cuentas alcanzadas: <b>${n.alcance}</b> · Visitas al perfil: ${n.visitasPerfil} · Clics a la web: ${n.clics}\nVisitas a la web desde Instagram: ${n.web} · Contactos por la web: ${n.contactos}`);
    }
    const quien = await sql<{ cuenta: string; n: number }[]>`select cuenta, count(*)::int n from seo.ig_acciones where tipo = 'responder' and fecha > current_date - ${ritmo.cada}::int
      and texto not like '(sin responder)%' and texto <> '(en curso)' group by cuenta order by n desc limit 10`;
    if (quien.length) lineas.push(`🎯 <b>Han hablado con nosotros:</b> ${quien.map((q) => "@" + esc(q.cuenta)).join(", ")}\nSi alguno es una empresa que encaja, dímelo y te preparo un mensaje.`);
    // avisos de lo que va a faltar (solo cuando falta de verdad)
    const [quedan] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_cola where tipo in ('reel', 'carrusel') and estado in ('pendiente', 'propuesto')`;
    if (quedan.n <= 1) lineas.push(`🛠 ${quedan.n ? "Solo queda 1 publicación" : "No quedan publicaciones"} en la cola. Cuando abras Claude Code, dime «prepara publicaciones nuevas para Instagram».`);
    const [hist] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_cola where tipo = 'historia' and estado = 'pendiente' and orden is not null`;
    if (hist.n < 4) lineas.push(`🛠 Quedan ${hist.n} historias en el banco. Dime «prepara historias para Instagram» y lo relleno.`);
    const manana = new Date(Date.now() + 86400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
    const [siguiente] = proximos(ritmo, 1, manana);
    const [lista] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_movil where fecha = ${siguiente}`;
    if (!lista.n) lineas.push(`📝 No tengo lista de cuentas para seguir y comentar el ${esc(bonita(siguiente))}. Cuando abras Claude Code, dime «prepara la lista de Instagram» y la dejo lista.`);
  }
  if (tocaHoy && plan && reelOk) await sql`update seo.ig_plan set estado = 'hecho', hecho_at = now(), informe = ${lineas.join("\n\n")} where fecha = ${hoy()} and estado not in ('hecho', 'rechazado')`;
  if (lineas.length) await enTrozos(`📲 <b>Instagram</b>`, lineas);
  return { ok: true, toca: tocaHoy, enviado: lineas.length > 0 };
}

// ---------------------------------------------------------------- 19:00 (lista al móvil si el PC no lo ha hecho)
type Movil = { id: number; tipo: string; cuenta: string; url: string; texto: string | null };

export async function tarde() {
  if ((await getRitmo()).pausas.instagram) return { ok: true, pausa: true };
  // si el reel de mediodía falló, segundo intento
  const [plan] = await sql<{ tareas: { tipo: string; ref?: string | null }[] }[]>`select tareas from seo.ig_plan where fecha = ${hoy()} and estado not in ('hecho', 'rechazado')`;
  const reel = plan?.tareas.find((t) => t.tipo === "reel" && t.ref)?.ref;
  if (reel && (await cred())) {
    const r = await subir(reel);
    await telegram(`🎬 Segundo intento: ${r.split("\n\nQuedan")[0]}`);
    // si ahora sí ha salido, su historia de aviso (la de las 13:10 no la pudo poner)
    if (r.startsWith("✅")) await avisoHistoria(reel).catch((e) => console.error("aviso historia", e));
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

// ---------------------------------------------------------------- historias
const BASE = process.env.APP_URL ?? "https://experto-en-seo.vercel.app";
const urlHistoria = (id: string) => `${BASE}/api/ig/historia?id=${encodeURIComponent(id)}`;

/** Historia que avisa de la publicación nueva del feed (una sola vez por publicación). */
async function avisoHistoria(nuevo: string) {
  const [f] = await sql<{ titulo: string; tipo: string }[]>`select titulo, tipo from seo.ig_cola where id = ${nuevo}`;
  if (!f) return null;
  const id = `h-aviso-${nuevo}`;
  const datos = { plantilla: "reel", reel: nuevo, etiqueta: f.tipo === "carrusel" ? "Nuevo en el perfil" : "Nuevo vídeo", titulo: f.titulo, texto: "Lo tienes en el perfil" };
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, historia_url, datos) values (${id}, 'historia', ${"Aviso: " + f.titulo}, '', ${urlHistoria(id)}, ${sql.json(datos)})
    on conflict (id) do nothing`;
  return subir(id);
}

/** 13:10 del día que toca: aviso de lo publicado hoy en el feed + 2 historias del banco (una pregunta arrastra su respuesta).
 *  Una vez al día como mucho; a Telegram solo si algo falla. */
export async function historias() {
  const ritmo = await getRitmo();
  if (ritmo.pausas.instagram || !toca(ritmo)) return { ok: true, nada: true };
  const [yo] = await sql`insert into seo.settings (key, value) values ('ig_historias_dia', ${sql.json(hoy())})
    on conflict (key) do update set value = excluded.value, updated_at = now() where seo.settings.value <> excluded.value returning key`;
  if (!yo) return { ok: true, yaHechas: true };
  const fallos: string[] = [];
  const hechas: string[] = [];
  const [nuevo] = await sql<{ id: string }[]>`select id from seo.ig_cola where tipo in ('reel', 'carrusel') and estado = 'publicado'
    and (publicado_at at time zone 'Europe/Madrid')::date = ${hoy()}::date order by publicado_at desc limit 1`;
  if (nuevo) {
    const r = await avisoHistoria(nuevo.id);
    if (r?.startsWith("✅")) hechas.push("aviso");
    else if (r) fallos.push(r);
  }
  // las que fallaron otro día ('propuesto') vuelven a intentarse
  const banco = await sql<{ id: string; datos: { plantilla: string } }[]>`select id, datos from seo.ig_cola where tipo = 'historia'
    and estado in ('pendiente', 'propuesto') and orden is not null order by orden limit 3`;
  const elegidas = banco.slice(0, 2);
  if (elegidas.at(-1)?.datos.plantilla === "pregunta" && banco[2]) elegidas.push(banco[2]);
  for (const h of elegidas) {
    const r = await subir(h.id);
    if (r.startsWith("✅")) hechas.push(h.id);
    else {
      fallos.push(r);
      if (h.datos.plantilla === "pregunta") break; // sin la pregunta, la respuesta no tiene sentido
    }
  }
  if (fallos.length) await telegram(`⚠️ <b>Historias de hoy</b>: han salido ${hechas.length}; no han salido:\n${fallos.join("\n")}\nSe reintentan el próximo día que toque.`);
  return { ok: true, hechas, fallos: fallos.length };
}

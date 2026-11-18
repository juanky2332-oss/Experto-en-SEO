import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { ReactNode } from "react";
import { sql } from "@/lib/db";

// Imagen 1080x1920 de una historia de Instagram (seo.ig_cola, tipo 'historia'): ?id=<id de la cola>. JPEG.
// Pública a propósito (Instagram la descarga): solo enseña lo que se va a publicar.
// Plantillas (agente-ig/ESTILO-CUENTA.md): consejo (claro) · dato (oscuro) · pregunta (degradado) · respuesta (claro) ·
// app (claro, pantalla del móvil) · mito (oscuro) · reel (aviso del vídeo nuevo con su portada).
// Zona segura: Instagram tapa ~250 px arriba y abajo; el contenido va entre medias.
export const runtime = "nodejs";
export const maxDuration = 60;

type Datos = { plantilla: string; etiqueta?: string; titulo: string; texto?: string; cifra?: string; nota?: string; img?: string; reel?: string; tuerqui?: string | false;
  // 17-11-2026 · plantillas problema / noticia / blog: el problema (o la noticia, o el artículo), qué hacer en 2-3 pasos y cómo lo resolvemos
  puntos?: string[]; cierre?: string; fuente?: string;
  // 18-11-2026 · estilo 2 (él: «céntralo todo, no tan aglutinado, Tuerqui más abajo, más directo»): v: 2.
  // acento = trozo del título que va en color. Plantilla «actualidad»: lo último del día en 3 bloques (IA · industria · automatización).
  v?: number; acento?: string; fecha?: string; tema?: "claro" | "oscuro"; items?: { cat: string; titular: string; significa?: string }[];
  // 18-11-2026 · estilo 3 (él: «más estético, más moderno, que se note profesional, del tono de Tuerqui»): v: 3.
  // Tarjeta con «antes / ahora» o con pasos, y Tuerqui hablando en un bocadillo (dice).
  antes?: string; ahora?: string; dice?: string };

const ICONO = "https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-icono-v2.png";
const W = 1080, H = 1920;
const C = {
  fondo: "#0b0614", rosa: "#e05cff", morado: "#a11cf0", indigo: "#5b3cff", suave: "#cfc3dc",
  claro: "#f7f3fd", tinta: "#1b1029", gris: "#5b4a6e", borde: "#e6dcf5",
};
// 11-11-2026: Tuerqui, la mascota (poses en demo.transformaconia.com/ig/tuerqui/). Pose según la plantilla; datos.tuerqui la cambia y false la quita.
const TUERQUI: Record<string, string> = { consejo: "senala", respuesta: "celebra", dato: "malabares", mito: "piensa", pregunta: "piensa", problema: "agobiado", noticia: "senala", blog: "senala", actualidad: "senala", truco: "senala", ia: "malabares" };
const POSES = new Set(["agobiado", "celebra", "piensa", "malabares", "senala", "saluda"]);
// La mascota es decoración: si no llega, la historia sale igual (nunca un 500 por ella)
async function pngDataUrl(url: string, ancho: number) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const buf = await sharp(Buffer.from(await r.arrayBuffer())).resize(ancho).png().toBuffer();
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
const DEGRADADO = "linear-gradient(135deg, #e05cff 0%, #a11cf0 50%, #5b3cff 100%)";

const fuentes = new Map<number, ArrayBuffer>();
async function poppins(peso: number) {
  if (fuentes.has(peso)) return fuentes.get(peso)!;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Poppins:wght@${peso}`)).text();
  const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error("fuente");
  const data = await (await fetch(url)).arrayBuffer();
  fuentes.set(peso, data);
  return data;
}

async function aDataUrl(url: string, ancho: number, alto?: number) {
  const r = await fetch(url);
  if (!r.ok) return null;
  const buf = await sharp(Buffer.from(await r.arrayBuffer())).resize(ancho, alto, { fit: "cover", position: "top" }).jpeg({ quality: 85 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

const Marca = ({ icono, claro, blanco }: { icono: string | null; claro: boolean; blanco?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {icono ? <img src={icono} width={60} height={60} style={{ borderRadius: 16 }} /> : null}
    <div style={{ display: "flex", marginLeft: 16, fontSize: 36, fontWeight: 600, color: claro ? C.tinta : "#fff" }}>
      Transforma<span style={{ color: blanco ? "rgba(255,255,255,0.8)" : claro ? C.gris : C.suave, fontWeight: 500, margin: "0 9px" }}>con</span><span style={{ color: blanco ? "#fff" : claro ? C.morado : C.rosa }}>IA</span>
    </div>
  </div>
);

const Etiqueta = ({ t, claro }: { t: string; claro: boolean }) => (
  <div style={{ display: "flex", alignSelf: "flex-start", padding: "12px 26px", borderRadius: 999, background: claro ? "#efe4fb" : "rgba(224,92,255,0.16)", color: claro ? C.morado : C.rosa, fontSize: 30, fontWeight: 600, letterSpacing: 3 }}>
    {t.toUpperCase()}
  </div>
);

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const [e] = await sql<{ titulo: string; datos: Datos | null }[]>`select titulo, datos from seo.ig_cola where id = ${id} and tipo in ('historia', 'noticia')`;
  if (!e?.datos) return new Response("no existe", { status: 404 });
  const d = e.datos;
  const claro = ["consejo", "respuesta", "app", "problema", "blog"].includes(d.plantilla);
  const degradado = d.plantilla === "pregunta";

  let portadaReel: string | null = null;
  if (d.plantilla === "reel" && d.reel) {
    const [r] = await sql<{ portada_url: string | null }[]>`select portada_url from seo.ig_cola where id = ${d.reel}`;
    if (r?.portada_url) portadaReel = await aDataUrl(r.portada_url, 640, 1138);
  }
  const cand = d.tuerqui === false ? null : (d.tuerqui || TUERQUI[d.plantilla] || null);
  const pose = cand && POSES.has(cand) ? cand : null;
  const [icono, captura, f800, f600, f500, mascota] = await Promise.all([
    aDataUrl(ICONO, 96, 96),
    d.plantilla === "app" && d.img ? aDataUrl(d.img, 620, 1342) : Promise.resolve(null),
    poppins(800), poppins(600), poppins(500),
    pose ? pngDataUrl(`https://demo.transformaconia.com/ig/tuerqui/${pose}.png`, 480) : Promise.resolve(null),
  ]);

  const tinta = claro ? C.tinta : "#fff";
  const suave = claro ? C.gris : C.suave;
  const largo = d.titulo.length;
  const tam = largo > 90 ? 64 : largo > 60 ? 74 : largo > 35 ? 86 : 100;
  const fondo = claro ? C.claro : degradado ? DEGRADADO : C.fondo;

  const cuerpo = (() => {
    switch (d.plantilla) {
      case "dato":
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {d.etiqueta ? <Etiqueta t={d.etiqueta} claro={false} /> : null}
            <div style={{ display: "flex", marginTop: 40, fontSize: (d.cifra ?? "").length > 6 ? 170 : 230, fontWeight: 800, lineHeight: 1, color: C.rosa, letterSpacing: -4 }}>{d.cifra}</div>
            <div style={{ display: "flex", marginTop: 34, fontSize: 64, fontWeight: 800, lineHeight: 1.15, color: "#fff" }}>{d.titulo}</div>
            {d.texto ? <div style={{ display: "flex", marginTop: 30, fontSize: 38, fontWeight: 500, lineHeight: 1.4, color: C.suave }}>{d.texto}</div> : null}
          </div>
        );
      case "mito":
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Etiqueta t={d.etiqueta ?? "Mito"} claro={false} />
            <div style={{ display: "flex", marginTop: 40, fontSize: tam, fontWeight: 800, lineHeight: 1.12, color: "#fff", textDecoration: "line-through", textDecorationColor: C.rosa }}>{d.titulo}</div>
            <div style={{ display: "flex", width: 200, height: 12, borderRadius: 6, marginTop: 50, background: DEGRADADO }} />
            {d.texto ? <div style={{ display: "flex", marginTop: 44, fontSize: 46, fontWeight: 600, lineHeight: 1.35, color: "#fff" }}>{d.texto}</div> : null}
          </div>
        );
      case "pregunta":
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ display: "flex", fontSize: 200, fontWeight: 800, color: "rgba(255,255,255,0.35)", lineHeight: 1 }}>?</div>
            {d.etiqueta ? <div style={{ display: "flex", marginTop: 20, fontSize: 32, fontWeight: 600, letterSpacing: 4, color: "rgba(255,255,255,0.85)" }}>{d.etiqueta.toUpperCase()}</div> : null}
            <div style={{ display: "flex", marginTop: 30, fontSize: tam, fontWeight: 800, lineHeight: 1.12, color: "#fff", justifyContent: "center" }}>{d.titulo}</div>
            <div style={{ display: "flex", marginTop: 60, padding: "22px 40px", borderRadius: 999, background: "rgba(11,6,20,0.35)", color: "#fff", fontSize: 34, fontWeight: 600 }}>{d.texto ?? "La respuesta, en la siguiente →"}</div>
          </div>
        );
      case "problema":
      case "noticia":
      case "blog": {
        // título grande, «qué hacer» en pasos numerados y un cierre destacado con la solución
        const tinta2 = claro ? C.tinta : "#fff";
        // la historia dura 5 s: poco texto y grande (título corto, 2 pasos, cierre corto)
        const t2 = largo > 55 ? 76 : largo > 35 ? 86 : 96;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {d.etiqueta ? <Etiqueta t={d.etiqueta} claro={claro} /> : null}
            <div style={{ display: "flex", marginTop: 30, fontSize: t2, fontWeight: 800, lineHeight: 1.1, color: tinta2 }}>{d.titulo}</div>
            {d.fuente ? <div style={{ display: "flex", marginTop: 14, fontSize: 28, fontWeight: 500, color: claro ? C.gris : C.suave }}>{d.fuente}</div> : null}
            {d.puntos?.length ? (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 36 }}>
                {d.texto ? <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 2, color: claro ? C.morado : C.rosa, marginBottom: 14 }}>{d.texto.toUpperCase()}</div> : null}
                {d.puntos.slice(0, 2).map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", marginTop: i ? 18 : 0 }}>
                    <div style={{ display: "flex", width: 56, height: 56, borderRadius: 28, background: DEGRADADO, color: "#fff", fontSize: 30, fontWeight: 800, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ display: "flex", marginLeft: 22, fontSize: 46, fontWeight: 600, lineHeight: 1.3, color: tinta2, flex: 1 }}>{p}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {d.cierre ? (
              <div style={{ display: "flex", marginTop: 38, padding: "30px 36px", borderRadius: 30, background: claro ? "#fff" : "rgba(255,255,255,0.08)", border: `2px solid ${claro ? C.borde : "rgba(224,92,255,0.45)"}`, fontSize: 42, fontWeight: 700, lineHeight: 1.3, color: tinta2 }}>{d.cierre}</div>
            ) : null}
          </div>
        );
      }
      case "app":
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch" }}>
              {d.etiqueta ? <Etiqueta t={d.etiqueta} claro /> : null}
              <div style={{ display: "flex", marginTop: 28, fontSize: largo > 45 ? 58 : 68, fontWeight: 800, lineHeight: 1.12, color: C.tinta }}>{d.titulo}</div>
            </div>
            {captura ? (
              <div style={{ display: "flex", marginTop: 46, width: 640, height: 900, borderRadius: 54, overflow: "hidden", border: "10px solid #1b1029", boxShadow: "0 30px 80px rgba(91,60,255,0.35)" }}>
                <img src={captura} width={620} height={1342} style={{ width: 620, height: 1342 }} />
              </div>
            ) : null}
            {d.texto ? <div style={{ display: "flex", marginTop: 36, fontSize: 34, fontWeight: 500, lineHeight: 1.35, color: C.gris, textAlign: "center" }}>{d.texto}</div> : null}
          </div>
        );
      case "reel":
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Etiqueta t={d.etiqueta ?? "Nuevo vídeo"} claro={false} />
            {portadaReel ? (
              <div style={{ display: "flex", marginTop: 40, width: 640, height: 1000, borderRadius: 36, overflow: "hidden", boxShadow: `0 0 0 4px ${C.morado}, 0 30px 80px rgba(161,28,240,0.45)` }}>
                <img src={portadaReel} width={640} height={1138} style={{ width: 640, height: 1138, marginTop: -69 }} />
              </div>
            ) : null}
            <div style={{ display: "flex", marginTop: 44, fontSize: 52, fontWeight: 800, lineHeight: 1.15, color: "#fff", textAlign: "center" }}>{d.titulo}</div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 34, fontWeight: 500, color: C.suave }}>{d.texto ?? "Lo tienes en el perfil"}</div>
          </div>
        );
      default: // consejo · respuesta (claros, con tarjeta)
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {d.etiqueta ? <Etiqueta t={d.etiqueta} claro /> : null}
            <div style={{ display: "flex", marginTop: 40, fontSize: tam, fontWeight: 800, lineHeight: 1.12, color: C.tinta }}>{d.titulo}</div>
            {d.texto ? (
              <div style={{ display: "flex", marginTop: 50, padding: "40px 44px", borderRadius: 36, background: "#fff", border: `2px solid ${C.borde}`, boxShadow: "0 20px 60px rgba(91,60,255,0.10)", fontSize: 42, fontWeight: 500, lineHeight: 1.4, color: C.tinta }}>
                {d.texto}
              </div>
            ) : null}
            {d.nota ? <div style={{ display: "flex", marginTop: 30, fontSize: 30, fontWeight: 500, color: C.gris }}>{d.nota}</div> : null}
          </div>
        );
    }
  })();

  // ── Estilo 3 (18-11-2026): tarjeta moderna centrada + Tuerqui con bocadillo ──
  const lienzoV3 = (() => {
    if (d.v !== 3) return null;
    const oscuro = d.tema ? d.tema === "oscuro" : ["noticia", "ia"].includes(d.plantilla);
    const tinta = oscuro ? "#fff" : C.tinta;
    const suave = oscuro ? C.suave : C.gris;
    const acento = oscuro ? C.rosa : C.morado;
    // palabra a palabra (para que parta renglón bien); dentro de cada palabra, lo que cae en el acento va en color.
    // Así «mano?» sigue junta y el «?» nunca se queda solo en una línea.
    const ini = d.acento ? d.titulo.indexOf(d.acento) : -1;
    const fin = ini < 0 ? -1 : ini + d.acento!.length;
    const palabras: { w: string; c: boolean }[][] = [];
    let pos = 0;
    for (const w of d.titulo.split(" ")) {
      if (w) {
        const segs: { w: string; c: boolean }[] = [];
        for (let k = 0; k < w.length; k++) {
          const c = pos + k >= ini && pos + k < fin;
          if (segs.length && segs[segs.length - 1].c === c) segs[segs.length - 1].w += w[k];
          else segs.push({ w: w[k], c });
        }
        palabras.push(segs);
      }
      pos += w.length + 1;
    }
    // Renglones equilibrados (él, 18-11: «que no aparezca ningún fallo»): se mide cada palabra (Poppins 800) y se elige
    // el reparto con menos renglones, todos parecidos y SIN ningún renglón de una palabra suelta. Si no cabe, baja la letra.
    const anchoLetra = (ch: string) => (/[¿?]/.test(ch) ? 0.5 : /[A-ZÁÉÍÓÚÑ0-9]/.test(ch) ? 0.72 : /[ilj.,:;'!¡]/.test(ch) ? 0.3 : /[mw]/.test(ch) ? 0.92 : 0.62);
    const MAXW = 880;
    const repartir = (size: number, lineas: number) => {
      const anchos = palabras.map((segs) => segs.reduce((a, s) => a + [...s.w].reduce((b, ch) => b + anchoLetra(ch) * size - 2, 0), 0));
      const hueco = size * 0.26;
      const n = anchos.length;
      let mejor: { cortes: number[]; nota: number } | null = null;
      if (lineas <= n) {
        // todas las formas de cortar las n palabras en «lineas» renglones
        const probar = (desde: number, quedan: number, cortes: number[]) => {
          if (quedan === 1) {
            const todos = [...cortes, n];
            let a = 0, max = 0, min = Infinity, ok = true;
            for (const c of todos) {
              const w = anchos.slice(a, c).reduce((x, y) => x + y, 0) + hueco * (c - a - 1);
              if (w > MAXW || (c - a === 1 && n > lineas && anchos[a] < MAXW * 0.6)) ok = false;
              // la parte en color nunca se parte en dos renglones
              if (c < n && palabras[c - 1].some((s) => s.c) && palabras[c].some((s) => s.c)) ok = false;
              max = Math.max(max, w); min = Math.min(min, w); a = c;
            }
            if (ok && (!mejor || max - min < mejor.nota)) mejor = { cortes: todos, nota: max - min };
            return;
          }
          for (let c = desde + 1; c <= n - quedan + 1; c++) probar(c, quedan - 1, [...cortes, c]);
        };
        probar(0, lineas, []);
      }
      return mejor as { cortes: number[]; nota: number } | null;
    };
    let tt = largo > 44 ? 82 : largo > 30 ? 94 : 106;
    let reparto: ReturnType<typeof repartir> = null;
    // primero pocos renglones (bajando la letra hasta 24 px si hace falta); solo si no hay manera, uno más
    fuera: for (let lineas = 1; lineas <= 4; lineas++) for (let s = tt; s >= Math.max(tt - 24, 64); s -= 6) { const r = repartir(s, lineas); if (r) { reparto = r; tt = s; break fuera; } }
    const renglones: { w: string; c: boolean }[][][] = [];
    { let a = 0; for (const c of reparto?.cortes ?? [palabras.length]) { renglones.push(palabras.slice(a, c)); a = c; } }
    // En los textos: espacio que no parte entre las dos últimas palabras (nunca una palabra sola en la última línea)
    const sv = (t?: string) => (t ? t.replace(/ (\S+)$/, "\u00a0$1") : t);
    const tarjeta = { display: "flex", flexDirection: "column" as const, width: "100%", marginTop: 64, padding: "40px 46px", borderRadius: 44,
      background: oscuro ? "rgba(255,255,255,0.06)" : "#fff", border: `2px solid ${oscuro ? "rgba(255,255,255,0.12)" : "rgba(161,28,240,0.10)"}`,
      boxShadow: oscuro ? "none" : "0 30px 80px rgba(60,20,120,0.12)" };
    const chip = (t: string, activo: boolean) => (
      <div style={{ display: "flex", padding: "8px 18px", borderRadius: 999, fontSize: 22, fontWeight: 700, letterSpacing: 3, color: activo ? "#fff" : suave,
        background: activo ? DEGRADADO : oscuro ? "rgba(255,255,255,0.10)" : "#f1ecf7" }}>{t}</div>
    );
    let contenido: ReactNode = null;
    if (d.antes && d.ahora) {
      contenido = (
        <div style={tarjeta}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            {chip("ANTES", false)}
            <div style={{ display: "flex", marginTop: 14, fontSize: 36, fontWeight: 500, lineHeight: 1.3, color: suave }}>{sv(d.antes)}</div>
          </div>
          <div style={{ display: "flex", height: 2, margin: "30px 0", background: oscuro ? "rgba(255,255,255,0.10)" : "#efe7f8" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            {chip("AHORA", true)}
            <div style={{ display: "flex", marginTop: 14, fontSize: 40, fontWeight: 700, lineHeight: 1.25, color: tinta }}>{sv(d.ahora)}</div>
          </div>
        </div>
      );
    } else if (d.puntos?.length) {
      contenido = (
        <div style={tarjeta}>
          {d.puntos.slice(0, 3).map((p, k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", marginTop: k ? 26 : 0 }}>
              <div style={{ display: "flex", width: 58, height: 58, borderRadius: 18, background: DEGRADADO, color: "#fff", fontSize: 30, fontWeight: 800, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{k + 1}</div>
              <div style={{ display: "flex", marginLeft: 24, fontSize: 38, fontWeight: 600, lineHeight: 1.25, color: tinta, flex: 1 }}>{sv(p)}</div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: oscuro ? C.fondo : "#f6f2fc", fontFamily: "Poppins" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex",
          background: oscuro
            ? "radial-gradient(circle at 10% 8%, rgba(161,28,240,0.45) 0%, rgba(11,6,20,0) 42%), radial-gradient(circle at 95% 85%, rgba(91,60,255,0.40) 0%, rgba(11,6,20,0) 45%)"
            : "radial-gradient(circle at 8% 6%, rgba(224,92,255,0.26) 0%, rgba(246,242,252,0) 40%), radial-gradient(circle at 96% 90%, rgba(91,60,255,0.20) 0%, rgba(246,242,252,0) 45%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex",
          backgroundImage: `radial-gradient(circle, ${oscuro ? "rgba(255,255,255,0.07)" : "rgba(91,60,255,0.09)"} 2px, transparent 2.5px)`, backgroundSize: "44px 44px" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", flexDirection: "column", alignItems: "center", padding: "160px 76px 190px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {icono ? <img src={icono} width={50} height={50} style={{ borderRadius: 14 }} /> : null}
            <div style={{ display: "flex", marginLeft: 14, fontSize: 30, fontWeight: 600, color: tinta }}>
              Transforma<span style={{ color: suave, fontWeight: 500, margin: "0 8px" }}>con</span><span style={{ color: acento }}>IA</span>
            </div>
          </div>
          <div style={{ display: "flex", flex: 1, flexDirection: "column", width: "100%", alignItems: "center", justifyContent: "center" }}>
            {d.etiqueta ? (
              <div style={{ display: "flex", alignItems: "center", padding: "12px 26px", borderRadius: 999, background: oscuro ? "rgba(224,92,255,0.14)" : "#fff", border: `2px solid ${oscuro ? "rgba(224,92,255,0.30)" : "rgba(161,28,240,0.14)"}`, color: acento, fontSize: 26, fontWeight: 700, letterSpacing: 3 }}>
                <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: DEGRADADO, marginRight: 14 }} />
                {d.etiqueta.toUpperCase()}
              </div>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, fontSize: tt, fontWeight: 800, lineHeight: 1.06, letterSpacing: -2, color: tinta }}>
              {renglones.map((linea, r) => (
                <div key={r} style={{ display: "flex", justifyContent: "center" }}>
                  {linea.map((segs, k) => (
                    <div key={k} style={{ display: "flex", margin: "0 0.13em" }}>
                      {segs.map((s, j) => <span key={j} style={{ color: s.c ? acento : tinta }}>{s.w}</span>)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {d.fuente ? <div style={{ display: "flex", marginTop: 22, fontSize: 26, fontWeight: 500, color: suave }}>{d.fuente}</div> : null}
            {contenido}
            {mascota || d.dice ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 56, width: "100%" }}>
                {mascota ? <img src={mascota} width={250} height={250} style={{ width: 250, height: 250 }} /> : null}
                {d.dice ? (
                  <div style={{ display: "flex", position: "relative", marginLeft: 18, maxWidth: 560, padding: "26px 32px", borderRadius: 34, background: oscuro ? "#fff" : C.tinta, color: oscuro ? C.tinta : "#fff", fontSize: 32, fontWeight: 600, lineHeight: 1.3 }}>
                    <div style={{ display: "flex", position: "absolute", left: -12, top: "50%", marginTop: -14, width: 28, height: 28, background: oscuro ? "#fff" : C.tinta, transform: "rotate(45deg)", borderRadius: 4 }} />
                    {sv(d.dice)}
                  </div>
                ) : null}
              </div>
            ) : null}
            {d.cierre ? <div style={{ display: "flex", marginTop: 34, fontSize: 28, fontWeight: 600, color: acento, letterSpacing: 0.5 }}>{sv(d.cierre)}</div> : null}
          </div>
        </div>
      </div>
    );
  })();

  // ── Estilo 2 (18-11-2026): todo centrado, con aire, Tuerqui abajo en el centro y un mensaje directo ──
  const v2 = d.v === 2 || d.plantilla === "actualidad";
  const Titulo = ({ t, size, color, acento }: { t: string; size: number; color: string; acento: string }) => {
    const i = d.acento ? t.indexOf(d.acento) : -1;
    const trozos = i < 0 ? [{ t, c: false }] : [{ t: t.slice(0, i), c: false }, { t: d.acento!, c: true }, { t: t.slice(i + d.acento!.length), c: false }];
    const palabras = trozos.flatMap((p) => p.t.split(" ").filter(Boolean).map((w) => ({ w, c: p.c })));
    return (
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", textAlign: "center", fontSize: size, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, color }}>
        {palabras.map((p, k) => <span key={k} style={{ color: p.c ? acento : color, margin: "0 0.13em" }}>{p.w}</span>)}
      </div>
    );
  };
  const lienzoV2 = (() => {
    if (!v2) return null;
    const oscuro = d.plantilla === "actualidad" ? d.tema !== "claro" : d.plantilla === "noticia";
    const tinta = oscuro ? "#fff" : C.tinta;
    const suave = oscuro ? C.suave : C.gris;
    const acento = oscuro ? C.rosa : C.morado;
    const pill = (t: string) => (
      <div style={{ display: "flex", padding: "14px 30px", borderRadius: 999, background: oscuro ? "rgba(224,92,255,0.16)" : "#efe4fb", color: acento, fontSize: 30, fontWeight: 700, letterSpacing: 4 }}>{t.toUpperCase()}</div>
    );
    let medio: ReactNode;
    if (d.plantilla === "actualidad") {
      const COL: Record<string, string> = { ia: "#e05cff", industria: "#ffb547", automatizacion: "#4fd1c5", "automatización": "#4fd1c5", ayudas: "#7cc4ff" };
      medio = (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {pill(`Lo último${d.fecha ? ` · ${d.fecha}` : ""}`)}
          <div style={{ display: "flex", marginTop: 34 }}><Titulo t={d.titulo} size={largo > 30 ? 66 : 76} color={tinta} acento={acento} /></div>
          <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 54 }}>
            {(d.items ?? []).slice(0, 3).map((it, i) => {
              const col = COL[it.cat.toLowerCase()] ?? C.rosa;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: i ? 24 : 0, padding: "26px 40px", borderRadius: 32, background: oscuro ? "rgba(255,255,255,0.06)" : "#fff", border: `2px solid ${oscuro ? "rgba(255,255,255,0.10)" : C.borde}` }}>
                  <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 4, color: col }}>{it.cat.toUpperCase()}</div>
                  <div style={{ display: "flex", marginTop: 10, fontSize: 38, fontWeight: 700, lineHeight: 1.2, color: tinta, textAlign: "center", justifyContent: "center" }}>{it.titular}</div>
                  {it.significa ? <div style={{ display: "flex", marginTop: 10, fontSize: 29, fontWeight: 500, lineHeight: 1.3, color: suave, textAlign: "center", justifyContent: "center" }}>→ {it.significa}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      const t2 = largo > 50 ? 84 : largo > 32 ? 96 : 112;
      medio = (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {d.etiqueta ? pill(d.etiqueta) : null}
          <div style={{ display: "flex", marginTop: 44 }}><Titulo t={d.titulo} size={t2} color={tinta} acento={acento} /></div>
          {d.fuente ? <div style={{ display: "flex", marginTop: 22, fontSize: 28, fontWeight: 500, color: suave }}>{d.fuente}</div> : null}
          {d.puntos?.length ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginTop: 70 }}>
              {d.puntos.slice(0, 2).map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", marginTop: i ? 26 : 0, fontSize: 44, fontWeight: 600, color: tinta }}>
                  <div style={{ display: "flex", width: 54, height: 54, borderRadius: 27, background: DEGRADADO, color: "#fff", fontSize: 28, fontWeight: 800, alignItems: "center", justifyContent: "center", marginRight: 22 }}>{i + 1}</div>
                  {p}
                </div>
              ))}
            </div>
          ) : null}
          {d.cierre ? (
            <div style={{ display: "flex", marginTop: 70, padding: "28px 48px", borderRadius: 999, background: DEGRADADO, color: "#fff", fontSize: 40, fontWeight: 700, textAlign: "center", justifyContent: "center", boxShadow: "0 18px 50px rgba(161,28,240,0.35)" }}>{d.cierre}</div>
          ) : null}
        </div>
      );
    }
    const tamM = d.plantilla === "actualidad" ? 250 : 330;
    return (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: oscuro ? C.fondo : C.claro, fontFamily: "Poppins" }}>
        {oscuro
          ? <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: "radial-gradient(circle at 50% 8%, rgba(161,28,240,0.38) 0%, rgba(11,6,20,0) 45%), radial-gradient(circle at 50% 100%, rgba(91,60,255,0.40) 0%, rgba(11,6,20,0) 45%)" }} />
          : <div style={{ position: "absolute", top: -300, left: 240, width: 600, height: 600, borderRadius: 300, display: "flex", background: "rgba(224,92,255,0.12)" }} />}
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", flexDirection: "column", alignItems: "center", padding: "170px 90px 200px" }}>
          <Marca icono={icono} claro={!oscuro} />
          <div style={{ display: "flex", height: 40 }} />
          <div style={{ display: "flex", flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}>{medio}</div>
          {mascota ? <img src={mascota} width={tamM} height={tamM} style={{ width: tamM, height: tamM }} /> : null}
        </div>
      </div>
    );
  })();

  const png = new ImageResponse(
    lienzoV3 ?? lienzoV2 ?? (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: fondo, fontFamily: "Poppins" }}>
        {!claro && !degradado ? (
          <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: "radial-gradient(circle at 15% 12%, rgba(161,28,240,0.40) 0%, rgba(11,6,20,0) 45%), radial-gradient(circle at 90% 92%, rgba(91,60,255,0.40) 0%, rgba(11,6,20,0) 50%)" }} />
        ) : null}
        {claro ? <div style={{ position: "absolute", top: -260, right: -260, width: 640, height: 640, borderRadius: 320, display: "flex", background: "rgba(224,92,255,0.14)" }} /> : null}
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "200px 80px 230px" }}>
          <Marca icono={icono} claro={claro} blanco={degradado} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {cuerpo}
            {mascota ? <img src={mascota} width={["problema", "noticia", "blog"].includes(d.plantilla) ? 300 : 440} height={["problema", "noticia", "blog"].includes(d.plantilla) ? 300 : 440} style={{ width: ["problema", "noticia", "blog"].includes(d.plantilla) ? 300 : 440, height: ["problema", "noticia", "blog"].includes(d.plantilla) ? 300 : 440, marginTop: 10, alignSelf: d.plantilla === "pregunta" ? "center" : "flex-end" }} /> : null}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, fontWeight: 500, color: suave }}>
            {/* 17-11-2026: la marca sale UNA sola vez (el logo de arriba); abajo ni la web ni la cuenta */}
            <span>{d.nota && !claro ? d.nota : ""}</span>
            <span style={{ color: tinta, fontWeight: 600 }}></span>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Poppins", data: f800, weight: 800, style: "normal" },
        { name: "Poppins", data: f600, weight: 600, style: "normal" },
        { name: "Poppins", data: f500, weight: 500, style: "normal" },
      ],
    },
  );
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90 }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600, s-maxage=3600" } });
}

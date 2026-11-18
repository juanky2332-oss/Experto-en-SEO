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
  v?: number; acento?: string; fecha?: string; tema?: "claro" | "oscuro"; items?: { cat: string; titular: string; significa?: string }[] };

const ICONO = "https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-icono-v2.png";
const W = 1080, H = 1920;
const C = {
  fondo: "#0b0614", rosa: "#e05cff", morado: "#a11cf0", indigo: "#5b3cff", suave: "#cfc3dc",
  claro: "#f7f3fd", tinta: "#1b1029", gris: "#5b4a6e", borde: "#e6dcf5",
};
// 11-11-2026: Tuerqui, la mascota (poses en demo.transformaconia.com/ig/tuerqui/). Pose según la plantilla; datos.tuerqui la cambia y false la quita.
const TUERQUI: Record<string, string> = { consejo: "senala", respuesta: "celebra", dato: "malabares", mito: "piensa", pregunta: "piensa", problema: "agobiado", noticia: "senala", blog: "senala", actualidad: "senala" };
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
    lienzoV2 ?? (
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

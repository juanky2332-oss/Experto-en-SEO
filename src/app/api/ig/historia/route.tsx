import { ImageResponse } from "next/og";
import sharp from "sharp";
import { sql } from "@/lib/db";

// Imagen 1080x1920 de una historia de Instagram (seo.ig_cola, tipo 'historia'): ?id=<id de la cola>. JPEG.
// Pública a propósito (Instagram la descarga): solo enseña lo que se va a publicar.
// Plantillas (agente-ig/ESTILO-CUENTA.md): consejo (claro) · dato (oscuro) · pregunta (degradado) · respuesta (claro) ·
// app (claro, pantalla del móvil) · mito (oscuro) · reel (aviso del vídeo nuevo con su portada).
// Zona segura: Instagram tapa ~250 px arriba y abajo; el contenido va entre medias.
export const runtime = "nodejs";
export const maxDuration = 60;

type Datos = { plantilla: string; etiqueta?: string; titulo: string; texto?: string; cifra?: string; nota?: string; img?: string; reel?: string };

const ICONO = "https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-icono-v2.png";
const W = 1080, H = 1920;
const C = {
  fondo: "#0b0614", rosa: "#e05cff", morado: "#a11cf0", indigo: "#5b3cff", suave: "#cfc3dc",
  claro: "#f7f3fd", tinta: "#1b1029", gris: "#5b4a6e", borde: "#e6dcf5",
};
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

const Marca = ({ icono, claro }: { icono: string | null; claro: boolean }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {icono ? <img src={icono} width={60} height={60} style={{ borderRadius: 16 }} /> : null}
    <div style={{ display: "flex", marginLeft: 16, fontSize: 36, fontWeight: 600, color: claro ? C.tinta : "#fff" }}>
      Transforma<span style={{ color: claro ? C.gris : C.suave, fontWeight: 500, margin: "0 9px" }}>con</span><span style={{ color: claro ? C.morado : C.rosa }}>IA</span>
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
  const [e] = await sql<{ titulo: string; datos: Datos | null }[]>`select titulo, datos from seo.ig_cola where id = ${id} and tipo = 'historia'`;
  if (!e?.datos) return new Response("no existe", { status: 404 });
  const d = e.datos;
  const claro = ["consejo", "respuesta", "app"].includes(d.plantilla);
  const degradado = d.plantilla === "pregunta";

  let portadaReel: string | null = null;
  if (d.plantilla === "reel" && d.reel) {
    const [r] = await sql<{ portada_url: string | null }[]>`select portada_url from seo.ig_cola where id = ${d.reel}`;
    if (r?.portada_url) portadaReel = await aDataUrl(r.portada_url, 640, 1138);
  }
  const [icono, captura, f800, f600, f500] = await Promise.all([
    aDataUrl(ICONO, 96, 96),
    d.plantilla === "app" && d.img ? aDataUrl(d.img, 620, 1342) : Promise.resolve(null),
    poppins(800), poppins(600), poppins(500),
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

  const png = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: fondo, fontFamily: "Poppins" }}>
        {!claro && !degradado ? (
          <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: "radial-gradient(circle at 15% 12%, rgba(161,28,240,0.40) 0%, rgba(11,6,20,0) 45%), radial-gradient(circle at 90% 92%, rgba(91,60,255,0.40) 0%, rgba(11,6,20,0) 50%)" }} />
        ) : null}
        {claro ? <div style={{ position: "absolute", top: -260, right: -260, width: 640, height: 640, borderRadius: 320, display: "flex", background: "rgba(224,92,255,0.14)" }} /> : null}
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "200px 80px 230px" }}>
          <Marca icono={icono} claro={claro} />
          <div style={{ display: "flex", flexDirection: "column" }}>{cuerpo}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, fontWeight: 500, color: suave }}>
            <span>{d.nota && !claro ? d.nota : "transformaconia.com"}</span>
            <span style={{ color: tinta, fontWeight: 600 }}>{d.plantilla === "pregunta" ? "" : "@transformaconia.oficial"}</span>
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

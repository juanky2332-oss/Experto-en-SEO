import { ImageResponse } from "next/og";
import sharp from "sharp";
import { articulo } from "@/lib/redes";

// Imagen de una noticia para Instagram: ?id=<post>&f=post (1080x1350) | story (1080x1920). JPEG, que es lo que admite Instagram.
// Pública a propósito (Instagram la descarga): solo enseña lo que ya está publicado en el blog.
export const runtime = "nodejs";
export const maxDuration = 60;

const ICONO = "https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-icono-v2.png";

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

async function aDataUrl(url: string, ancho: number, alto: number) {
  const r = await fetch(url);
  if (!r.ok) return null;
  const buf = await sharp(Buffer.from(await r.arrayBuffer())).resize(ancho, alto, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = Number(u.searchParams.get("id"));
  const story = u.searchParams.get("f") === "story";
  if (!Number.isInteger(id) || id <= 0) return new Response("id", { status: 400 });
  const a = await articulo(id);
  if (!a) return new Response("no existe", { status: 404 });

  const W = 1080, H = story ? 1920 : 1350;
  const [fondo, icono, f800, f600, f500] = await Promise.all([
    a.imagen ? aDataUrl(a.imagen, W, H) : Promise.resolve(null),
    aDataUrl(ICONO, 96, 96),
    poppins(800), poppins(600), poppins(500),
  ]);
  const largo = a.titulo.length;
  const tam = story ? (largo > 80 ? 70 : 84) : (largo > 80 ? 58 : 68);

  const png = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#0b0614", fontFamily: "Poppins" }}>
        {fondo ? <img src={fondo} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} /> : null}
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: "linear-gradient(180deg, rgba(11,6,20,0.55) 0%, rgba(11,6,20,0.15) 28%, rgba(11,6,20,0.55) 52%, rgba(11,6,20,0.96) 74%, #0b0614 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: story ? "110px 72px 140px" : "64px 64px 70px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {icono ? <img src={icono} width={64} height={64} style={{ borderRadius: 16 }} /> : null}
              <div style={{ display: "flex", marginLeft: 18, fontSize: 38, fontWeight: 600, color: "#fff" }}>
                Transforma<span style={{ color: "#cfc3dc", fontWeight: 500, margin: "0 10px" }}>con</span><span style={{ color: "#e05cff" }}>IA</span>
              </div>
            </div>
            <div style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "rgba(161,28,240,0.85)", color: "#fff", fontSize: 26, fontWeight: 600 }}>{a.categoria}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#e05cff", fontSize: 28, fontWeight: 600, letterSpacing: 4, marginBottom: 18 }}>NUEVO EN EL BLOG</div>
            <div style={{ display: "flex", color: "#fff", fontSize: tam, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>{a.titulo}</div>
            <div style={{ display: "flex", width: 260, height: 12, borderRadius: 6, marginTop: 34, background: "linear-gradient(90deg, #e05cff, #a11cf0, #5b3cff)" }} />
            <div style={{ display: "flex", marginTop: 30, color: "#cfc3dc", fontSize: story ? 34 : 28, fontWeight: 500 }}>
              {story ? "Léelo completo: enlace en el perfil" : "Léelo completo en transformaconia.com"}
            </div>
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
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 88 }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}

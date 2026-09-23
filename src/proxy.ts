import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, tokenValido } from "@/lib/sesion";

export async function proxy(req: NextRequest) {
  if (await tokenValido(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("volver", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // públicos: login, endpoints de n8n (clave propia) y cron (CRON_SECRET), estáticos
  matcher: ["/((?!login|api/telegram|api/cron|_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt).*)"],
};

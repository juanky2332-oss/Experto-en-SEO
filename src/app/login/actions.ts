"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, crearToken, mismaClave } from "@/lib/sesion";

export async function entrar(_: { error?: string } | undefined, form: FormData) {
  const clave = String(form.get("clave") ?? "");
  if (!mismaClave(clave, process.env.APP_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Contraseña incorrecta" };
  }
  (await cookies()).set(COOKIE, await crearToken(), { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  const volver = String(form.get("volver") ?? "/");
  redirect(volver.startsWith("/") && !volver.startsWith("//") ? volver : "/");
}

export async function salir() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "seo_sesion";
const clave = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "cambia-esto");

export async function crearToken() {
  return new SignJWT({ u: "juanky" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(clave());
}

export async function tokenValido(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, clave());
    return true;
  } catch {
    return false;
  }
}

/** Comparación en tiempo constante (clave de la pasarela y del cron). */
export function mismaClave(a: string | null | undefined, b: string | undefined) {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

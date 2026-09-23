"use client";
import { useActionState } from "react";
import { entrar } from "./actions";

export function Formulario({ volver }: { volver: string }) {
  const [estado, accion, cargando] = useActionState(entrar, undefined);
  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="volver" value={volver} />
      <div>
        <label htmlFor="clave" className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label>
        <input id="clave" name="clave" type="password" autoFocus required className="input" autoComplete="current-password" />
      </div>
      {estado?.error && <p className="text-sm text-rose-600">{estado.error}</p>}
      <button disabled={cargando} className="btn btn-primary w-full justify-center py-2.5">{cargando ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}

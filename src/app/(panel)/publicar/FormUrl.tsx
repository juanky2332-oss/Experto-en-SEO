"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { prepararUrl } from "../acciones";

export function FormUrl() {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pend, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await prepararUrl(url.trim());
          setMsg(r.ok ? { ok: true, t: r.mensaje ?? "Enviado" } : { ok: false, t: r.error });
          if (r.ok) {
            setUrl("");
            setTimeout(() => router.refresh(), 60_000);
          }
        });
      }}
    >
      <input className="input flex-1" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://techcrunch.com/2026/…" />
      <button className="btn btn-primary justify-center" disabled={pend}>{pend ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Preparar</button>
      {msg && <p className={`text-sm sm:self-center ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.t}</p>}
    </form>
  );
}

"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gauge, Loader2 } from "lucide-react";
import { velocidad } from "../acciones";

export function Velocidad({ urls }: { urls: { label: string; url: string }[] }) {
  const [url, setUrl] = useState(urls[0]?.url ?? "");
  const [err, setErr] = useState("");
  const [pend, start] = useTransition();
  const router = useRouter();
  return (
    <div className="space-y-2">
      <select className="input" value={url} onChange={(e) => setUrl(e.target.value)}>
        {urls.map((u) => <option key={u.url} value={u.url}>{u.label}</option>)}
      </select>
      <button className="btn btn-primary w-full justify-center" disabled={pend} onClick={() => start(async () => {
        setErr("");
        const r = await velocidad(url);
        if (!r.ok) setErr(r.error); else router.refresh();
      })}>
        {pend ? <Loader2 size={15} className="animate-spin" /> : <Gauge size={15} />} {pend ? "Midiendo (30-60 s)…" : "Medir velocidad"}
      </button>
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </div>
  );
}

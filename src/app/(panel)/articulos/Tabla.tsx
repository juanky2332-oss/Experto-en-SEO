"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Badge, ScoreRing, ESTADOS, GRAVEDAD, fecha } from "@/components/ui";
import { NOMBRE_PROBLEMA, type Gravedad } from "@/lib/seo/analizar";

export type FilaTabla = {
  id: number; title: string; status: string; date: string; link: string; slug: string; categoria: string;
  score: number; palabras: number; internos: number; keyword: string;
  problemas: { codigo: string; titulo: string; gravedad: Gravedad }[];
};

const ORDEN = { score_asc: "Peor puntuación", score_desc: "Mejor puntuación", fecha: "Más recientes", palabras: "Más cortos" } as const;

export function Tabla({ filas, categorias, problemaInicial }: { filas: FilaTabla[]; categorias: string[]; problemaInicial?: string }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("publish");
  const [cat, setCat] = useState("");
  const [problema, setProblema] = useState(problemaInicial ?? "");
  const [orden, setOrden] = useState<keyof typeof ORDEN>("score_asc");

  const codigos = useMemo(() => {
    const m = new Map<string, string>();
    filas.forEach((f) => f.problemas.forEach((p) => m.set(p.codigo, NOMBRE_PROBLEMA[p.codigo] ?? p.titulo)));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [filas]);

  const vista = useMemo(() => {
    const n = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const r = filas.filter((f) =>
      (!estado || f.status === estado) && (!cat || f.categoria.includes(cat)) && (!problema || f.problemas.some((p) => p.codigo === problema)) &&
      (!q || n(`${f.title} ${f.keyword} ${f.slug} ${f.id}`).includes(n(q))));
    return [...r].sort((a, b) =>
      orden === "score_asc" ? a.score - b.score : orden === "score_desc" ? b.score - a.score : orden === "palabras" ? a.palabras - b.palabras : b.date.localeCompare(a.date));
  }, [filas, q, estado, cat, problema, orden]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute top-2.5 left-3 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, keyword, URL o ID…" className="input pl-9" />
        </div>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="input w-auto">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input w-auto">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={problema} onChange={(e) => setProblema(e.target.value)} className="input w-auto max-w-[240px]">
          <option value="">Cualquier problema</option>
          {codigos.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as keyof typeof ORDEN)} className="input w-auto">
          {Object.entries(ORDEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <p className="px-4 pt-3 text-xs text-slate-500">{vista.length} de {filas.length} artículos</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase">
              <th className="px-4 py-3 font-medium">SEO</th>
              <th className="px-4 py-3 font-medium">Artículo</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Categoría</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Palabras</th>
              <th className="px-4 py-3 font-medium">Problemas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {vista.map((f) => (
              <tr key={f.id} className="align-top hover:bg-slate-50/70">
                <td className="px-4 py-3"><ScoreRing score={f.score} size={40} stroke={4} /></td>
                <td className="max-w-[420px] px-4 py-3">
                  <Link href={`/articulos/${f.id}`} className="font-medium text-slate-900 hover:text-brand-700">{f.title}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <Badge tone={ESTADOS[f.status]?.tone}>{ESTADOS[f.status]?.label ?? f.status}</Badge>
                    <span>{fecha(f.date)}</span>
                    {f.keyword && <Badge tone="blue">{f.keyword}</Badge>}
                    <a href={f.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-brand-600">ver <ExternalLink size={11} /></a>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{f.categoria}</td>
                <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{f.palabras.toLocaleString("es-ES")}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {f.problemas.slice(0, 2).map((p) => (
                      <span key={p.codigo} className="flex items-center gap-1.5 text-xs"><Badge tone={GRAVEDAD[p.gravedad].tone}>{GRAVEDAD[p.gravedad].label}</Badge><span className="text-slate-600">{p.titulo}</span></span>
                    ))}
                    {f.problemas.length > 2 && <span className="text-xs text-slate-400">+{f.problemas.length - 2} más</span>}
                    {!f.problemas.length && <span className="text-xs text-emerald-600">Todo correcto</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

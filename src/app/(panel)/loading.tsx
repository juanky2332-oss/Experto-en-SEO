export default function Cargando() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-64 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-200/70" />)}</div>
      <div className="h-72 rounded-2xl bg-slate-200/60" />
      <p className="text-sm text-slate-500">Leyendo transformaconia.com y analizando cada artículo…</p>
    </div>
  );
}

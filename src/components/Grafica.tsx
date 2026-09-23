"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function GraficaSalud({ datos }: { datos: { fecha: string; score: number }[] }) {
  if (datos.length < 2)
    return <p className="py-10 text-center text-sm text-slate-500">La evolución aparecerá a partir del segundo día de análisis (se guarda una foto diaria).</p>;
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ left: -20, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b6cf6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b6cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="fecha" tickFormatter={(f: string) => f.slice(5).split("-").reverse().join("/")} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${v}/100`, "Salud SEO"]} labelFormatter={(f) => String(f)} />
          <Area type="monotone" dataKey="score" stroke="#2554e8" strokeWidth={2} fill="url(#g)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

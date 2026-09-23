import clsx from "clsx";
import type { ReactNode } from "react";
import type { Gravedad } from "@/lib/seo/analizar";

export function Card({ children, className, title, action, subtitle }: { children: ReactNode; className?: string; title?: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <section className={clsx("card", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const TONOS = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  lime: "bg-lime-50 text-lime-700 ring-lime-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
} as const;
export type Tono = keyof typeof TONOS;

export function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: Tono; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TONOS[tone], className)}>{children}</span>;
}

export const tonoScore = (s: number): Tono => (s >= 85 ? "emerald" : s >= 70 ? "lime" : s >= 50 ? "amber" : "rose");
const COLOR_RING: Record<string, string> = { emerald: "#10b981", lime: "#84cc16", amber: "#f59e0b", rose: "#f43f5e" };

export function ScoreRing({ score, size = 44, stroke = 5, label }: { score: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = COLOR_RING[tonoScore(score)] ?? "#94a3b8";
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} title={label ?? `Puntuación SEO ${score}/100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef0f5" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} />
      </svg>
      <span className="absolute font-semibold text-slate-800" style={{ fontSize: size * 0.3 }}>{score}</span>
    </div>
  );
}

export function Stat({ label, value, hint, icon, tone }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tono }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      {icon && <div className={clsx("rounded-xl p-2.5 ring-1 ring-inset", TONOS[tone ?? "blue"])}>{icon}</div>}
      <div className="min-w-0">
        <p className="text-[13px] text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export const GRAVEDAD: Record<Gravedad, { tone: Tono; label: string }> = {
  critica: { tone: "rose", label: "Crítico" },
  alta: { tone: "amber", label: "Alto" },
  media: { tone: "blue", label: "Medio" },
  baja: { tone: "slate", label: "Bajo" },
};

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-slate-500">{children}</div>;
}

export const fecha = (s: string | Date, conHora = false) =>
  new Date(s).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "short", year: "numeric", ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}) });

export const ESTADOS: Record<string, { label: string; tone: Tono }> = {
  publish: { label: "Publicado", tone: "emerald" },
  draft: { label: "Borrador", tone: "slate" },
  pending: { label: "Pendiente", tone: "amber" },
  future: { label: "Programado", tone: "violet" },
  private: { label: "Privado", tone: "slate" },
};

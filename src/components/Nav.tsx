"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Compass, Newspaper, Send, BarChart3, Settings, Sparkles, type LucideIcon } from "lucide-react";

// 3 áreas principales + 2 secundarias. Cada área tiene sus pestañas (se pintan en <Pestanas />).
type Area = { href: string; label: string; desc: string; icon: LucideIcon; tabs: { href: string; label: string }[]; principal: boolean };
export const AREAS: Area[] = [
  {
    href: "/", label: "Qué publicar", desc: "Recomendaciones, guía y auditoría", icon: Compass, principal: true,
    tabs: [{ href: "/", label: "Recomendaciones" }, { href: "/guia", label: "Guía editorial" }, { href: "/estrategia", label: "Estrategia" }, { href: "/auditoria", label: "Auditoría" }],
  },
  {
    href: "/noticias", label: "Noticias", desc: "Buscar temas y radar", icon: Newspaper, principal: true,
    tabs: [{ href: "/noticias", label: "Buscar" }, { href: "/noticias/radar", label: "Radar" }],
  },
  {
    href: "/publicar", label: "Publicar", desc: "Briefs, artículos y páginas", icon: Send, principal: true,
    tabs: [{ href: "/publicar", label: "Briefs y redacción" }, { href: "/articulos", label: "Artículos" }, { href: "/paginas", label: "Páginas" }],
  },
  { href: "/resultados", label: "Resultados", desc: "", icon: BarChart3, principal: false, tabs: [{ href: "/resultados", label: "Visitas y embudo" }, { href: "/resultados/salud", label: "Salud SEO" }] },
  { href: "/ajustes", label: "Ajustes", desc: "", icon: Settings, principal: false, tabs: [{ href: "/ajustes", label: "Ajustes" }, { href: "/historial", label: "Historial" }] },
];

const coincide = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
/** Área a la que pertenece la ruta (por sus pestañas). */
export function areaDe(path: string) {
  return AREAS.find((a) => a.tabs.some((t) => coincide(path, t.href))) ?? AREAS[0];
}
/** Pestaña activa: la más específica que coincide. */
export function pestanaDe(path: string, a: Area) {
  return [...a.tabs].sort((x, y) => y.href.length - x.href.length).find((t) => coincide(path, t.href));
}

export function Nav() {
  const path = usePathname();
  const actual = areaDe(path);
  return (
    <>
      {/* Escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink-950 text-slate-300 lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-600/30">
            <Sparkles size={18} />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-white">Experto en SEO</p>
            <p className="text-xs text-slate-400">transformaconia.com</p>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {AREAS.filter((a) => a.principal).map((a) => {
            const on = a === actual;
            return (
              <Link key={a.href} href={a.href} className={clsx("flex items-center gap-3 rounded-xl px-3 py-3 transition", on ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white")}>
                <a.icon size={20} className={on ? "text-brand-500" : "text-slate-500"} />
                <span className="leading-tight">
                  <span className={clsx("block text-[15px]", on && "font-semibold")}>{a.label}</span>
                  <span className="block text-xs text-slate-500">{a.desc}</span>
                </span>
              </Link>
            );
          })}
          <div className="!mt-6 border-t border-white/10 pt-3">
            {AREAS.filter((a) => !a.principal).map((a) => {
              const on = a === actual;
              return (
                <Link key={a.href} href={a.href} className={clsx("flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition", on ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
                  <a.icon size={15} className={on ? "text-brand-500" : "text-slate-500"} />
                  {a.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="m-3 rounded-xl bg-white/5 p-3 text-xs text-slate-400">
          Cada cambio queda en el <b className="text-slate-200">historial</b> y te llega por <b className="text-slate-200">Telegram</b> con botón para deshacer.
        </div>
      </aside>
      {/* Móvil */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white"><Sparkles size={14} /></div>
          <p className="text-sm font-semibold">Experto en SEO</p>
        </div>
        <nav className="grid grid-cols-5 gap-1 px-2 pb-2">
          {AREAS.map((a) => (
            <Link key={a.href} href={a.href} className={clsx("flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] leading-tight", a === actual ? "bg-brand-600 text-white" : a.principal ? "bg-slate-100 font-medium text-slate-700" : "text-slate-500")}>
              <a.icon size={16} />{a.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}

/** Pestañas del área actual (encima del contenido de cada página). */
export function Pestanas() {
  const path = usePathname();
  const a = areaDe(path);
  const activa = pestanaDe(path, a);
  if (a.tabs.length < 2) return null;
  return (
    <nav aria-label={a.label} className="scroll-thin mb-6 flex gap-1 overflow-x-auto border-b border-[var(--line)]">
      {a.tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t === activa ? "page" : undefined}
          className={clsx("-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition", t === activa ? "border-brand-600 font-medium text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800")}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

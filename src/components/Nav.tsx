"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, FileText, Send, Radar, Compass, ShieldCheck, Files, History, Settings, Sparkles } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/articulos", label: "Artículos", icon: FileText },
  { href: "/publicar", label: "Publicar", icon: Send },
  { href: "/radar", label: "Radar IA", icon: Radar },
  { href: "/estrategia", label: "Estrategia", icon: Compass },
  { href: "/auditoria", label: "Auditoría", icon: ShieldCheck },
  { href: "/paginas", label: "Páginas", icon: Files },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function Nav() {
  const path = usePathname();
  const activo = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
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
        <nav className="mt-2 flex-1 space-y-0.5 px-3">
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition", activo(href) ? "bg-white/10 font-medium text-white" : "hover:bg-white/5 hover:text-white")}>
              <Icon size={17} className={activo(href) ? "text-brand-500" : "text-slate-500"} />
              {label}
            </Link>
          ))}
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
        <nav className="scroll-thin flex gap-1 overflow-x-auto px-3 pb-2">
          {ITEMS.map(({ href, label }) => (
            <Link key={href} href={href} className={clsx("rounded-full px-3 py-1 text-[13px] whitespace-nowrap", activo(href) ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600")}>{label}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}

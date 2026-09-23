import { Sparkles } from "lucide-react";
import { Formulario } from "./Formulario";

export const metadata = { title: "Entrar" };

export default async function Login({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver = "/" } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-xl shadow-brand-600/30"><Sparkles /></div>
          <h1 className="mt-4 text-xl font-semibold text-white">Experto en SEO</h1>
          <p className="mt-1 text-sm text-slate-400">Centro de control de transformaconia.com</p>
        </div>
        <div className="card p-6"><Formulario volver={volver} /></div>
      </div>
    </div>
  );
}

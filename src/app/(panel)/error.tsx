"use client";
export default function ErrorPanel({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center">
      <p className="text-lg font-semibold">Algo ha fallado</p>
      <p className="mt-2 text-sm text-slate-500">{error.message}</p>
      <button onClick={reset} className="btn btn-primary mt-5">Reintentar</button>
    </div>
  );
}

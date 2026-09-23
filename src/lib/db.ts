import "server-only";
import postgres from "postgres";

// Esquema "seo" dentro del proyecto Supabase ERP PRUEBA (aislado del ERP).
// Pooler en modo transacción (puerto 6543) → sin sentencias preparadas.
const g = globalThis as unknown as { __seoSql?: postgres.Sql };

export const sql =
  g.__seoSql ??
  (g.__seoSql = postgres(process.env.DATABASE_URL ?? "", {
    prepare: false,
    ssl: "require",
    max: 3,
    idle_timeout: 20,
    connect_timeout: 15,
    connection: { search_path: "seo" },
  }));

export type Accion = {
  id: number;
  created_at: string;
  origin: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  summary: string;
  before: unknown;
  after: unknown;
  status: string;
  error: string | null;
};

export type Ajustes = { modo: "publicar" | "borrador"; score_minimo: number; imagenes: string };

export async function getAjustes(): Promise<Ajustes> {
  const [r] = await sql<{ value: Ajustes }[]>`select value from seo.settings where key = 'publicacion'`;
  return r?.value ?? { modo: "publicar", score_minimo: 80, imagenes: "gpt-image-2" };
}

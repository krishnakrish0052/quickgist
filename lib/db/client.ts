import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "@/lib/config";

const { Pool } = pg;

const globalForDb = globalThis as unknown as {
  quickgistPool?: pg.Pool;
};

export function isPostgresEnabled(): boolean {
  return config.storageDriver === "postgres";
}

export function getPool(): pg.Pool {
  if (!globalForDb.quickgistPool) {
    globalForDb.quickgistPool = new Pool({
      connectionString: config.databaseUrl,
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  return globalForDb.quickgistPool;
}

export function getDrizzleDb() {
  return drizzle(getPool());
}

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export async function pingDatabase(): Promise<{ ok: boolean; error?: string }> {
  if (!isPostgresEnabled()) return { ok: true };
  try {
    await query("select 1 as ok");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function closeDatabase(): Promise<void> {
  if (globalForDb.quickgistPool) {
    await globalForDb.quickgistPool.end();
    globalForDb.quickgistPool = undefined;
  }
}

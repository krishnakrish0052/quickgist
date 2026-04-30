import { promises as fs } from "node:fs";
import path from "node:path";
import { closeDatabase, getPool, query } from "@/lib/db/client";

const migrationsDir = path.join(process.cwd(), "db", "migrations");

await query(`
  create table if not exists migrations (
    id text primary key,
    applied_at timestamptz not null default now()
  )
`);

const applied = new Set((await query<{ id: string }>("select id from migrations")).map((row) => row.id));
const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip ${file}`);
    continue;
  }

  const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
  const client = await getPool().connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into migrations (id) values ($1)", [file]);
    await client.query("commit");
    console.log(`applied ${file}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

await closeDatabase();

import { query } from "@/lib/db/client";
import { closeDatabase } from "@/lib/db/client";

await query("drop schema public cascade");
await query("create schema public");
await query(`grant all on schema public to quickgist`);
await query(`grant all on schema public to public`);
console.log("reset public schema");

await import("./db-migrate");
await import("./db-seed");
await closeDatabase();

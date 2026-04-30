/**
 * Soft preflight: report which optional services are reachable.
 * Never fails the process. Prints a concise summary so users know whether
 * QuickGist will run in memory mode, postgres mode, or with full BullMQ workers.
 */
import { config } from "@/lib/config";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

async function checkPostgres(): Promise<CheckResult> {
  if (config.storageDriver !== "postgres") {
    return { name: "PostgreSQL", ok: true, detail: "memory mode (no DB needed)" };
  }
  try {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: config.databaseUrl });
    await client.connect();
    const { rows } = await client.query<{ version: string }>("select version() as version");
    await client.end();
    return { name: "PostgreSQL", ok: true, detail: rows[0]?.version?.split(" ").slice(0, 2).join(" ") ?? "connected" };
  } catch (error) {
    return {
      name: "PostgreSQL",
      ok: false,
      detail: `unreachable at ${config.databaseUrl} — set STORAGE_DRIVER=memory for dev (${(error as Error).message})`
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  if (config.queueDriver !== "bullmq" || !config.redisUrl) {
    return { name: "Redis", ok: true, detail: "inline mode (no Redis needed)" };
  }
  try {
    const { default: IORedis } = await import("ioredis");
    const client = new IORedis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return { name: "Redis", ok: pong === "PONG", detail: `responded ${pong}` };
  } catch (error) {
    return {
      name: "Redis",
      ok: false,
      detail: `unreachable at ${config.redisUrl} — unset REDIS_URL or set QUEUE_DRIVER=inline (${(error as Error).message})`
    };
  }
}

async function main() {
  console.log("QuickGist preflight\n");
  console.log(`  storage driver : ${config.storageDriver}`);
  console.log(`  queue driver   : ${config.queueDriver}`);
  console.log(`  site url       : ${config.siteUrl}`);
  console.log(`  brand          : ${config.brandName}\n`);

  const results = await Promise.all([checkPostgres(), checkRedis()]);
  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    console.log(`  ${icon} ${r.name.padEnd(12)} ${r.detail}`);
  }
  console.log();

  const allOk = results.every((r) => r.ok);
  if (allOk) {
    console.log("All configured services reachable. Run `npm run dev`.");
  } else {
    console.log(
      "Some services not reachable. QuickGist will still run in degraded mode " +
        "(memory storage / inline queue). For full persistence install PostgreSQL and Redis natively."
    );
  }
}

main().catch((error) => {
  console.error("Preflight error:", error);
  process.exit(0);
});

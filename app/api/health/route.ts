import { ok } from "@/lib/api";
import { config } from "@/lib/config";
import { pingDatabase } from "@/lib/db/client";
import { getOperationsSnapshot } from "@/lib/services/observability";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await pingDatabase();
  const snapshot = database.ok ? await getOperationsSnapshot().catch(() => null) : null;

  return ok({
    ok: database.ok,
    storageDriver: config.storageDriver,
    database,
    snapshot,
    timestamp: new Date().toISOString()
  });
}

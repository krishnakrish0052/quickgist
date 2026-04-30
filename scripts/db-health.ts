import { pingDatabase } from "@/lib/db/client";
import { closeDatabase } from "@/lib/db/client";
import { getOperationsSnapshot } from "@/lib/services/observability";

const database = await pingDatabase();
console.log(JSON.stringify({ database, snapshot: database.ok ? await getOperationsSnapshot() : null }, null, 2));
await closeDatabase();

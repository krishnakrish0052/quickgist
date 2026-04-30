import { seedRepository } from "@/lib/repositories/platformRepository";
import { closeDatabase } from "@/lib/db/client";

await seedRepository();
console.log("seeded QuickGist demo sources, topics, claims, and article");
await closeDatabase();

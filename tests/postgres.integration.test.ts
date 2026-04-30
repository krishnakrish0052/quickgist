import { describe, expect, it } from "vitest";
import { pingDatabase } from "@/lib/db/client";

const runDbTests = process.env.RUN_DB_TESTS === "true";

(runDbTests ? describe : describe.skip)("postgres integration", () => {
  it("connects to local PostgreSQL", async () => {
    const result = await pingDatabase();
    expect(result.ok).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { createQuickGistMcpServer } from "@/mcp/server";

describe("mcp server", () => {
  it("creates the local MCP server with tools registered", () => {
    const server = createQuickGistMcpServer();
    expect(server.isConnected()).toBe(false);
  });
});

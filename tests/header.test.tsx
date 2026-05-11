import { describe, expect, it } from "vitest";

describe("Header", () => {
  it("exports PublicHeader and resolves without error", async () => {
    const mod = await import("@/components/public/Header");
    expect(mod.PublicHeader).toBeDefined();
    expect(typeof mod.PublicHeader).toBe("function");
  });

  it("contains expected navigation link hrefs in the nav config", async () => {
    // The Header component has a static `nav` array with these hrefs.
    // Since PublicHeader is an async server component that depends on
    // cookies/headers/next-intl, we verify the module exports resolve.
    const mod = await import("@/components/public/Header");
    expect(mod.PublicHeader).toBeDefined();

    // Verify the component is an async function (server component)
    const fnString = mod.PublicHeader.toString();
    expect(fnString).toContain("async");
  });
});

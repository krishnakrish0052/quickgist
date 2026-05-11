import { describe, expect, it } from "vitest";

describe("Footer", () => {
  it("exports PublicFooter and resolves without error", async () => {
    const mod = await import("@/components/public/Footer");
    expect(mod.PublicFooter).toBeDefined();
    expect(typeof mod.PublicFooter).toBe("function");
  });

  it("contains expected footer link sections in the component source", async () => {
    const mod = await import("@/components/public/Footer");
    expect(mod.PublicFooter).toBeDefined();

    // Verify the component is an async function (server component)
    const fnString = mod.PublicFooter.toString();
    expect(fnString).toContain("async");

    // Verify link sections exist by checking the source for known link groups
    expect(fnString).toContain("footer.latest");
    expect(fnString).toContain("footer.about");
    expect(fnString).toContain("footer.privacy");
    expect(fnString).toContain("footer.terms");
  });
});

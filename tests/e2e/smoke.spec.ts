import { expect, test } from "@playwright/test";

test("public homepage renders without admin link", async ({ page }) => {
  await page.goto("/");
  // Homepage either shows the lead headline or the "Newsroom warming up" empty state
  const heading = page.getByRole("heading", { level: 1 }).first();
  await expect(heading).toBeVisible();
  // Public site should never link to /admin from any header/nav
  const adminLinks = await page.locator("a[href^='/admin']").count();
  expect(adminLinks).toBe(0);
});

test("admin redirects to login when unauthenticated", async ({ page }) => {
  const response = await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  expect(response?.status()).toBeLessThan(500);
  await expect(page.getByRole("heading", { name: /Operator console/i })).toBeVisible();
});

test("RSS route returns valid XML", async ({ request }) => {
  const rss = await request.get("/rss.xml");
  expect(rss.ok()).toBeTruthy();
  expect(await rss.text()).toContain("<rss");
});

test("admin login form is reachable", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByLabel(/Admin/i)).toBeVisible();
});

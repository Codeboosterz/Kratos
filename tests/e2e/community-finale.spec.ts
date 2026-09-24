import { expect, test } from "@playwright/test";

test("homepage reveals coaching offer immediately after the hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#offer-title")).toBeVisible();
  expect(await page.locator("#offer-title").evaluate(element => element.closest("section")?.previousElementSibling?.classList.contains("home-scroll-hero"))).toBe(true);
  await expect(page.getByRole("link", { name: /Bekijk alle trajecten/ })).toHaveAttribute("href", "/trajecten");
  await expect(page.locator(".faith-story")).toHaveCount(0);
});

import { expect, test } from "@playwright/test";

test("Faith & Fitness is presented as a separate community event", async ({ page }) => {
  await page.goto("/community");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("FAITH.");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("COMMUNITY.");
  await expect(page.getByText("KRATOS Faith & Fitness staat los van onze persoonlijke coachingstrajecten.")).toBeVisible();
  await expect(page.locator('main a[href*="/intake"]')).toHaveCount(0);
});

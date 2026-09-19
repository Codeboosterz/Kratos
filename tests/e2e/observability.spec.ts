import { expect, test } from "@playwright/test";

test("public policy navigation restores the intake without hydration errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/intake");
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Privacy-informatie" })).toBeVisible();
  await page.getByRole("link", { name: "cookievoorkeuren" }).click();
  await expect(page.getByRole("heading", { name: "Jouw voorkeuren" })).toBeVisible();
  await page.getByTestId("save-cookie-preferences").click();
  await expect(page.getByTestId("save-cookie-preferences")).toHaveText("Voorkeur opgeslagen");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Privacy-informatie" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Waar wil je naartoe?", exact: true })).toBeVisible();
  await expect(page.locator(".header-cta")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("browser error reports are redacted and deduplicated", async ({ page }) => {
  const reports: unknown[] = [];
  await page.route("**/api/telemetry/errors", async (route) => {
    reports.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });
  await page.goto("/intake?source=about-final");
  await page.getByRole("radio", { name: "Afvallen" }).check({ force: true });
  await page.evaluate(() => {
    for (let count = 0; count < 3; count++) window.dispatchEvent(new ErrorEvent("error", {
      message: "private@example.invalid secret-token", error: new Error("private context"),
    }));
  });
  await expect.poll(() => reports.length).toBe(1);
  expect(reports).toEqual([{ kind: "window", route: "/intake" }]);
});

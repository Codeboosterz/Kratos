import { expect, test } from "@playwright/test";

test("intake contact opens cleanly and only submits on an explicit final action", async ({ page }) => {
  const submissions: unknown[] = [];
  await page.route("**/api/intake", async (route) => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, demo: true, reference: "DEMO-TRANSITION", schedulingUrl: null }) });
  });
  await page.goto("/intake");
  await page.getByRole("radio", { name: "Afvallen" }).check({ force: true });
  await page.getByRole("radio", { name: "Beginner" }).check({ force: true });
  await page.getByRole("button", { name: /Volgende stap/ }).click();
  await page.getByRole("radio", { name: "Online coaching" }).check({ force: true });
  await page.getByLabel("Wanneer kun je meestal trainen?").fill("Maandagavond");
  await page.getByRole("button", { name: /Volgende stap/ }).click();
  await expect(page.getByRole("heading", { name: "Hoe bereiken we je?" })).toBeFocused();
  await expect(page.locator("form [role=alert]")).toHaveCount(0);
  expect(submissions).toHaveLength(0);
  await page.getByLabel("Naam", { exact: true }).fill("QA Local");
  await page.getByLabel("E-mailadres").fill("qa@example.invalid");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Terug", exact: true }).click();
  await page.getByRole("button", { name: /Volgende stap/ }).press("Enter");
  await expect(page.getByRole("heading", { name: "Hoe bereiken we je?" })).toBeFocused();
  await expect(page.locator("form [role=alert]")).toHaveCount(0);
  expect(submissions).toHaveLength(0);
  await page.getByTestId("submit-intake").click();
  await expect(page.getByRole("heading", { name: "Intake ontvangen" })).toBeVisible();
  expect(submissions).toHaveLength(1);
});

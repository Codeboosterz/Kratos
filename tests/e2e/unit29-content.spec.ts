import { expect, test } from "@playwright/test";

test("price request keeps an editable product and intent in the existing lead payload", async ({ page }) => {
  const payload: Record<string, unknown> = {};
  await page.route("**/api/intake", async route => {
    Object.assign(payload, route.request().postDataJSON());
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, reference: "DEMO-UNIT29", demo: true, schedulingUrl: null }) });
  });
  await page.goto("/intake?source=product-detail&product=duo-coaching&intent=price");
  await page.getByRole("radio", { name: "Afvallen" }).check({ force: true });
  await page.getByRole("radio", { name: "Beginner" }).check({ force: true });
  await page.getByRole("button", { name: /Volgende stap/ }).click();
  await expect(page.getByLabel("Welk traject spreekt je aan?")).toHaveValue("duo-coaching");
  await expect(page.getByRole("radio", { name: "Prijsinformatie" })).toBeChecked();
  await page.getByLabel("Welk traject spreekt je aan?").selectOption("premium-online-coaching");
  await page.reload();
  await expect(page.getByLabel("Welk traject spreekt je aan?")).toHaveValue("premium-online-coaching");
  await page.locator("label.choice-card").filter({ hasText: "Online coaching" }).click();
  await expect(page.getByRole("radio", { name: "Online coaching" })).toBeChecked();
  await page.getByLabel("Wanneer kun je meestal trainen?").fill("Maandagavond");
  await page.getByRole("button", { name: /Volgende stap/ }).click();
  await page.getByLabel("Naam").fill("Ada Tester");
  await page.getByLabel("E-mailadres").fill("ada@example.com");
  await page.getByRole("checkbox").check();
  await page.getByTestId("submit-intake").click();
  await expect(page.getByRole("heading", { name: "Intake ontvangen" })).toBeVisible();
  expect(payload).toMatchObject({ product: "premium-online-coaching", source: "product-detail" });
  expect(String(payload.note)).toContain("Intentie: prijsinformatie.");
});

test("unknown product selection safely defaults to no selection", async ({ page }) => {
  await page.goto("/intake?product=does-not-exist&intent=price");
  await page.getByRole("radio", { name: "Afvallen" }).check({ force: true });
  await page.getByRole("radio", { name: "Beginner" }).check({ force: true });
  await page.getByRole("button", { name: /Volgende stap/ }).click();
  await expect(page.getByLabel("Welk traject spreekt je aan?")).toHaveValue("");
});

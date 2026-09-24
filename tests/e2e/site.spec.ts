import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import catalogue from "../../config/products.json";

const publicRoutes = ["/", "/werkwijze", "/trajecten", "/resultaten", "/over-omar", "/gratis-tools", "/intake", "/contact", "/privacy", "/voorwaarden", "/cookies", "/trajecten/transformatie-pack-10-sessies"];

test("canonical routes render and public controls have real targets", async ({ page, request }) => {
  const consoleProblems: string[] = [];
  page.on("console", (message) => { if (["warning", "error"].includes(message.type())) consoleProblems.push(`${message.type()}: ${message.text()}`); });
  for (const route of publicRoutes) {
    const response = await page.goto(route); expect(response?.status(), route).toBeLessThan(400); await expect(page.locator("h1").first(), route).toBeVisible();
    const routeHrefs = await page.locator("a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(routeHrefs.every((href) => href && href !== "#" && !href.startsWith("javascript:")), route).toBe(true);
  }
  const redirect = await request.get("/diensten", { maxRedirects: 0 }); expect(redirect.status()).toBe(308); expect(redirect.headers().location).toContain("/trajecten");
  await page.goto("/");
  const hrefs = await page.locator("a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs.every((href) => href && href !== "#" && !href.startsWith("javascript:"))).toBe(true);
  expect(consoleProblems).toEqual([]);
});

test("intake validates steps and returns a demo reference", async ({ page }) => {
  await page.goto("/intake?product=transformatie-pack-10-sessies&source=product-detail");
  const progress = page.getByRole("list", { name: "Voortgang" });
  const progressStep = (label: string) => progress.locator("li").filter({ hasText: label });
  await expect(progressStep("Doel")).toHaveAttribute("aria-current", "step");
  await expect(page.getByText("Stap 1 van 4")).toBeVisible();
  await page.getByRole("radio", { name: "Afvallen" }).check({ force: true }); await page.getByRole("radio", { name: "Beginner" }).check({ force: true }); await page.getByRole("button", { name: /Volgende stap/ }).click();
  await expect(progressStep("Voorkeuren")).toHaveAttribute("aria-current", "step");
  await page.getByRole("radio", { name: "Online coaching" }).check({ force: true }); await page.getByLabel("Wanneer kun je meestal trainen?").fill("Maandag, woensdag en vrijdag"); await page.getByRole("button", { name: /Volgende stap/ }).click();
  await expect(progressStep("Contact")).toHaveAttribute("aria-current", "step");
  await page.reload();
  await expect(progressStep("Contact")).toHaveAttribute("aria-current", "step");
  await expect(page.getByLabel("Wanneer kun je meestal trainen?")).toHaveCount(0);
  await page.getByLabel("Naam").fill("Ada Tester"); await page.getByLabel("E-mailadres").fill("ada@example.com"); await page.getByRole("checkbox").check(); await page.getByTestId("submit-intake").click();
  await expect(progressStep("Afspraak")).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("heading", { name: "Intake ontvangen" })).toBeVisible(); await expect(page.locator(".intake-reference small")).toHaveText(/DEMO-INT-/);
  await expect(page.getByText(/We nemen persoonlijk contact met je op/i)).toBeVisible();
  await expect(page.getByText("Lokale demo — niet zichtbaar in het live CMS")).toBeVisible();
});

test("intake retains answers and source after a storage failure and retries safely", async ({ page }) => {
  const attempts: Array<{ key: string; source: string; idempotencyKey: string }> = [];
  await page.route("**/api/intake", async (route) => {
    attempts.push({ key: route.request().headers()["idempotency-key"], ...route.request().postDataJSON() });
    await route.fulfill({
      status: attempts.length === 1 ? 503 : 201,
      contentType: "application/json",
      body: JSON.stringify(attempts.length === 1
        ? { ok: false, error: { code: "DATABASE_FAILURE", message: "De intake kon niet veilig worden opgeslagen. Probeer opnieuw.", retryable: true } }
        : { ok: true, reference: "DEMO-INT-RETRY", demo: true, schedulingUrl: null }),
    });
  });
  await page.goto("/intake?source=about-final");
  await page.getByRole("radio", { name: "Afvallen" }).check({ force: true });
  await page.getByRole("radio", { name: "Beginner" }).check({ force: true });
  await page.getByRole("button", { name: /Volgende stap/ }).click();
  await page.getByRole("radio", { name: "Online coaching" }).check({ force: true });
  await page.getByLabel("Wanneer kun je meestal trainen?").fill("Maandagavond");
  await page.getByRole("button", { name: /Volgende stap/ }).click();
  await page.getByLabel("Naam").fill("Ada Tester");
  await page.getByLabel("E-mailadres").fill("ada@example.com");
  await page.getByRole("checkbox").check();
  await page.getByTestId("submit-intake").click();
  await expect(page.locator("form").getByRole("alert")).toContainText("niet veilig worden opgeslagen");
  await expect(page.getByRole("heading", { name: "Intake ontvangen" })).toHaveCount(0);
  await expect(page.getByLabel("Naam")).toHaveValue("Ada Tester");
  await expect(page.getByLabel("E-mailadres")).toHaveValue("ada@example.com");
  await page.reload();
  await expect(page.getByLabel("Naam")).toHaveValue("Ada Tester");
  await expect(page.getByLabel("E-mailadres")).toHaveValue("ada@example.com");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("checkbox").check();
  await page.getByTestId("submit-intake").click();
  await expect(page.getByRole("heading", { name: "Intake ontvangen" })).toBeVisible();
  expect(attempts).toHaveLength(2);
  expect(attempts.every((attempt) => attempt.source === "about-final" && attempt.key === attempt.idempotencyKey)).toBe(true);
  expect(attempts[1].key).toBe(attempts[0].key);
});

test("fixture checkout uses a server-owned paid state", async ({ page }) => {
  await page.goto("/checkout/transformatie-pack-10-sessies"); await expect(page.getByText("Testbedrag — geen productieprijs")).toBeVisible(); await page.getByTestId("open-checkout").click();
  await expect(page).toHaveURL(/checkout\/success\?session_id=demo_cs_/); await expect(page.getByTestId("checkout-status")).toContainText("Betaling bevestigd"); await expect(page.getByTestId("checkout-status")).toContainText("geen echte betaling");
});

test("checkout has one brand header and retries the same logical session", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/checkout/transformatie-pack-10-sessies");
  await expect(page.locator(".checkout-header")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  const attempts: string[] = [];
  await page.route("**/api/checkout/session", async (route) => {
    attempts.push(route.request().headers()["idempotency-key"]);
    await route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: { message: "De betaalprovider is tijdelijk niet beschikbaar." } }) });
  });
  await page.getByTestId("open-checkout").click();
  await expect(page.locator(".checkout-main").getByRole("alert")).toContainText("tijdelijk niet beschikbaar");
  await expect(page.getByTestId("open-checkout")).toBeEnabled();
  await page.getByTestId("open-checkout").click();
  await expect.poll(() => attempts.length).toBe(2);
  expect(attempts[1]).toBe(attempts[0]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.goto("/checkout/success");
  await expect(page.locator(".checkout-header")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
});

test("key pages have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/", "/trajecten", "/intake", "/community", "/checkout/transformatie-pack-10-sessies"]) { await page.goto(route); const results = await new AxeBuilder({ page }).analyze(); expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact || "")), route).toEqual([]); }
});

test("all eight products remain visible with truthful price actions", async ({ page }) => {
  await page.goto("/trajecten?categorie=alle");
  const cards = page.locator(".product-card");
  await expect(cards).toHaveCount(8);
  for (const product of catalogue.products.filter(item => item.active)) {
    const card = cards.filter({ has: page.locator(`a[href="/trajecten/${product.slug}"]`) });
    await expect(card).toContainText("Prijs op aanvraag");
    await expect(card.locator(".product-card__highlights li")).toHaveCount(3);
    await expect(card.getByRole("link", { name: /Vraag prijs en trajectinformatie aan/ })).toHaveAttribute("href", new RegExp(`product=${product.slug}`));
    await page.goto(`/trajecten/${product.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.name);
    await expect(page.getByTestId("start-product")).toHaveAttribute("href", `/intake?source=product-detail&product=${product.slug}&intent=price`);
    await page.goto("/trajecten?categorie=alle");
  }
});

test("community keeps the tools redirect and has no coaching interest action", async ({ page, request }) => {
  const redirect = await request.get("/gratis-tools", { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  await page.goto("/community");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("COMMUNITY.");
  await expect(page.getByTestId("community-interest")).toHaveCount(0);
});

test("320px layout has no horizontal overflow and mobile navigation works", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 }); await page.goto("/"); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true); await page.getByRole("button", { name: "Menu openen" }).click(); await expect(page.getByRole("navigation", { name: "Mobiele navigatie" })).toBeVisible();
});

test("375px public routes use legible controls and contained swipe rails", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  for (const route of ["/", "/trajecten", "/intake", "/resultaten", "/gratis-tools", "/contact"]) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), route).toBe(true);
  }

  await page.goto("/trajecten");
  await expect(page.locator(".filter-bar")).toHaveCSS("scrollbar-width", "none");

  await page.goto("/gratis-tools");
  await expect(page).toHaveURL(/\/community$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("COMMUNITY.");

  await page.goto("/intake");
  await expect(page.locator(".intake-step-heading")).toBeInViewport();

  await page.goto("/contact");
  const footerTargetHeights = await page.locator(".footer-grid a:not(.brand)").evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
  expect(footerTargetHeights.every((height) => height >= 44)).toBe(true);
});

test("home, method and community keep their key content visible with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#offer-title")).toBeVisible();
  await expect(page.locator("#omar-title")).toHaveText("Omar.");
  await page.goto("/werkwijze");
  await expect(page.locator(".process-timeline")).toContainText("Vertel ons je doel");
  await page.goto("/community");
  await expect(page.getByTestId("sticky-intake")).toHaveCount(0);
});

test("owner CMS login is branded, private and honest before provider configuration", async ({ page }) => {
  const response = await page.goto("/beheer/login");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Welkom terug." })).toBeVisible();
  await expect(page.getByText("Eenmalige configuratie nodig")).toBeVisible();
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});

test("captures visual QA evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/"); await page.screenshot({ path: "artifacts/qa/home-1440.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/trajecten");
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((resolve) => setTimeout(resolve, 20)); } window.scrollTo(0, 0); });
  await page.screenshot({ path: "artifacts/qa/trajecten-390.png", fullPage: true });
});

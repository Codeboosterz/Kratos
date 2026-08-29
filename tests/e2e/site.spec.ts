import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
  await expect(page.getByText(/agenda.*nog niet gekoppeld/i)).toBeVisible();
  await expect(page.getByText("Lokale demo — niet zichtbaar in het live CMS")).toBeVisible();
});

test("fixture checkout uses a server-owned paid state", async ({ page }) => {
  await page.goto("/checkout/transformatie-pack-10-sessies"); await expect(page.getByText("Testbedrag — geen productieprijs")).toBeVisible(); await page.getByTestId("open-checkout").click();
  await expect(page).toHaveURL(/checkout\/success\?session_id=demo_cs_/); await expect(page.getByTestId("checkout-status")).toContainText("Betaling bevestigd"); await expect(page.getByTestId("checkout-status")).toContainText("geen echte betaling");
});

test("key pages have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/", "/trajecten", "/intake", "/checkout/transformatie-pack-10-sessies"]) { await page.goto(route); const results = await new AxeBuilder({ page }).analyze(); expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact || "")), route).toEqual([]); }
});

test("trajectory cards use the approved editorial artwork and CMS-ready hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/trajecten?categorie=alle");

  const cards = page.locator(".product-card");
  await expect(cards).toHaveCount(8);

  for (let index = 0; index < await cards.count(); index += 1) {
    const card = cards.nth(index);
    await expect(card.locator(".product-card__highlights li")).toHaveCount(3);
    await expect(card.locator("img")).toHaveAttribute("alt", /\S/);
    await expect(card.locator("img")).toHaveAttribute("src", /images(?:%2F|\/)programs(?:%2F|\/)cards/);
    await expect(card.getByRole("link", { name: "Bekijk traject", exact: true })).toBeVisible();
  }
});

test("gratis tools calculate deterministic results before AI explanation", async ({ page }) => {
  await page.goto("/gratis-tools");

  const bmiTool = page.locator(".tool-card--live").filter({ hasText: "BMI-indicatie" });
  await bmiTool.getByRole("button", { name: "Bereken BMI" }).click();
  await expect(bmiTool.locator(".tool-result")).toContainText("24.1");
  await expect(bmiTool.locator(".tool-result")).toContainText("Gezond gewicht");

  const calorieTool = page.locator(".tool-card--live").filter({ hasText: "Caloriebehoefte" });
  await calorieTool.getByRole("button", { name: "Bereken indicatie" }).click();
  await expect(calorieTool.locator(".tool-result")).toContainText("2720");
  await expect(calorieTool.locator(".tool-result")).toContainText("rust 1755 kcal");
});

test("320px layout has no horizontal overflow and mobile navigation works", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 }); await page.goto("/"); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true); await page.getByRole("button", { name: "Menu openen" }).click(); await expect(page.getByRole("navigation", { name: "Mobiele navigatie" })).toBeVisible();
});

test("floating intake CTA is not rendered", async ({ page }) => {
  await page.goto("/"); await expect(page.locator(".community-reveal")).toHaveClass(/is-ready/); await page.evaluate(() => window.scrollTo(0, 1200)); await expect(page.getByTestId("sticky-intake")).toHaveCount(0); await page.goto("/intake"); await expect(page.getByTestId("sticky-intake")).toHaveCount(0);
});

test("first-scroll storytelling animations complete without hiding copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const heroAccents = page.locator("#home-title .motion-word");
  await expect(heroAccents.first()).toHaveCSS("opacity", "0.42");
  await page.evaluate(() => window.scrollTo(0, 12));
  await expect(heroAccents.first()).toHaveCSS("opacity", "1", { timeout: 2_000 });
  await expect(heroAccents.nth(1)).toHaveCSS("opacity", "1", { timeout: 2_000 });

  await page.goto("/werkwijze");
  await page.locator("#method-title").scrollIntoViewIfNeeded();
  await expect(page.locator("#method-title .typewriter-line > span").last()).toHaveCSS("opacity", "1", { timeout: 3_000 });
  await expect(page.locator("#method-title .motion-line")).toHaveCSS("opacity", "1", { timeout: 3_000 });

  await page.goto("/resultaten");
  await page.locator("#client-stories-title").scrollIntoViewIfNeeded();
  await expect(page.locator(".client-story-card").first()).toBeVisible();
  await expect(page.locator(".client-stories-rail")).toHaveAttribute("aria-label", /toekomstige cliëntverhalen/);
});

test("homepage hero scrubs the recovered lift sequence once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const hero = page.getByTestId("scroll-hero");
  const canvas = page.getByTestId("scroll-hero-canvas");
  const endTagline = page.getByTestId("scroll-hero-end-tagline");
  await expect(hero).toHaveAttribute("data-sequence-ready", "true", { timeout: 8_000 });
  await page.waitForTimeout(1_000);
  expect(Number(await hero.getAttribute("data-sequence-loaded"))).toBeLessThanOrEqual(12);
  expect(await hero.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(2_500);
  await expect(canvas).toHaveAttribute("data-frame", "001");
  await expect(endTagline).toHaveCSS("opacity", "0");
  await expect(endTagline).toContainText("Word sterker.");
  await expect(endTagline).toContainText("Blijf sterker.");

  const scrollRange = await hero.evaluate((element) => element.getBoundingClientRect().height - window.innerHeight);
  await page.evaluate((distance) => window.scrollTo(0, distance * 0.52), scrollRange);
  await page.waitForTimeout(1_500);
  const middleFrame = Number(await canvas.getAttribute("data-frame"));
  expect(middleFrame).toBeGreaterThan(42);
  expect(middleFrame).toBeLessThan(92);

  await page.evaluate((distance) => window.scrollTo(0, distance), scrollRange);
  await page.waitForTimeout(1_500);
  expect(Number(await canvas.getAttribute("data-frame"))).toBeGreaterThan(112);
  await expect(endTagline).toHaveCSS("opacity", "1");
  await expect(endTagline).toBeInViewport();
  await expect(endTagline.locator(".home-scroll-hero__end-tagline-line").first()).toBeInViewport();
  await expect(endTagline.locator(".home-scroll-hero__end-tagline-line").last()).toBeInViewport();
});

test("essential homepage scroll sequences remain functional with reduced motion enabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const marquee = page.locator(".brand-marquee__track");
  const marqueeX = () => marquee.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  const marqueeStart = await marqueeX();
  await expect.poll(marqueeX, { timeout: 3_000 }).toBeLessThan(marqueeStart - 8);

  const reducedHero = page.getByTestId("scroll-hero");
  const reducedCanvas = page.getByTestId("scroll-hero-canvas");
  await expect(reducedHero).toHaveAttribute("data-sequence-ready", "true", { timeout: 8_000 });
  const reducedHeroHeight = await reducedHero.evaluate((element) => element.getBoundingClientRect().height);
  expect(reducedHeroHeight).toBeGreaterThan(2_500);
  await expect(reducedCanvas).toHaveCSS("display", "block");
  await page.evaluate((distance) => window.scrollTo(0, distance), (reducedHeroHeight - 800) * 0.35);
  await page.waitForTimeout(500);
  expect(Number(await reducedCanvas.getAttribute("data-frame"))).toBeGreaterThan(20);

  const grid = page.locator(".community-reveal");
  const items = grid.locator(".grid_item");
  const visibleItems = () => items.evaluateAll((elements) => elements.filter((element) => {
    const style = getComputedStyle(element);
    return style.visibility !== "hidden" && Number(style.opacity) > 0.05;
  }).length);

  await expect(grid).toHaveClass(/is-ready/);
  expect(await visibleItems()).toBe(1);
  await expect(page.locator("#omar-title")).toHaveText("mar");
  await expect(grid).toHaveAttribute("data-community-pin-start", /\d/);
  await expect(grid).toHaveAttribute("data-community-pin-end", /\d/);

  const pinRange = await grid.evaluate((element) => ({
    start: Number(element.dataset.communityPinStart),
    end: Number(element.dataset.communityPinEnd),
  }));
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(pinRange.end - pinRange.start).toBeGreaterThan(viewportHeight * 2);

  const scrollRevealTo = (progress: number) => page.evaluate(({ start, end, progress }) => {
    window.scrollTo(0, start + (end - start) * progress);
  }, { ...pinRange, progress });
  const sticky = grid.locator(".grid_sticky");
  const stickyTop = () => sticky.evaluate((element) => element.getBoundingClientRect().top);
  const revealProgress = () => grid.evaluate((element) => Number(element.dataset.communityProgress ?? "0"));

  await scrollRevealTo(0.1);
  await expect.poll(revealProgress).toBeGreaterThan(0.08);
  const pinnedTop = await stickyTop();

  await scrollRevealTo(0.55);
  await expect.poll(async () => Math.abs((await stickyTop()) - pinnedTop)).toBeLessThan(2);
  await expect.poll(visibleItems).toBeGreaterThan(1);

  await scrollRevealTo(0.97);
  await expect.poll(async () => Math.abs((await stickyTop()) - pinnedTop)).toBeLessThan(2);
  await expect.poll(visibleItems).toBe(await items.count());
  await expect.poll(() => grid.locator(".grid_item_middle").evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.abs(Math.hypot(matrix.a, matrix.b) - 1);
  })).toBeLessThan(0.03);

  await page.evaluate(({ end, viewportHeight }) => {
    window.scrollTo(0, end + viewportHeight * 0.3);
  }, { end: pinRange.end, viewportHeight });
  await expect.poll(revealProgress).toBe(1);
  await expect.poll(async () => pinnedTop - (await stickyTop())).toBeGreaterThan(100);
  await expect.poll(() => page.locator(".faith-section").evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(viewportHeight);
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

import { expect, test } from "@playwright/test";

test("mobile community reveal responds to motion preferences", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const tile = page.locator(".community-reveal .grid_item").first();
  await expect.poll(() => tile.evaluate(e => getComputedStyle(e).opacity)).toBe("1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => tile.evaluate(e => getComputedStyle(e).opacity)).toBe("0.35");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => tile.evaluate(e => getComputedStyle(e).opacity)).toBe("1");
});

test("marquee responds to motion preference changes without reloading", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const track = page.locator(".brand-marquee__track");
  await expect.poll(() => track.evaluate(e => getComputedStyle(e).transform)).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => track.evaluate(e => getComputedStyle(e).transform)).not.toBe("none");
  const first = await track.evaluate(e => getComputedStyle(e).transform);
  await expect.poll(() => track.evaluate(e => getComputedStyle(e).transform)).not.toBe(first);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => track.evaluate(e => getComputedStyle(e).transform)).toBe("none");
});

test("mobile uses the native portrait sequence and reverses within a bounded cache", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const desktopFrames: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/hero-frames/")) desktopFrames.push(request.url());
  });
  await page.goto("/");
  const hero = page.getByTestId("scroll-hero");
  const canvas = page.getByTestId("scroll-hero-canvas");
  await expect(hero).toHaveAttribute("data-sequence-ready", "true");
  await expect(canvas).toHaveAttribute("data-sequence", "mobile-curls");
  await expect.poll(() => hero.locator("picture img").evaluate((image: HTMLImageElement) => image.currentSrc)).toContain("hero-frames-mobile-curls/frame_001.webp");
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  const end = await hero.evaluate(element => element.getBoundingClientRect().bottom + scrollY - innerHeight);
  await page.evaluate(y => scrollTo(0, y), end);
  await expect(canvas).toHaveAttribute("data-frame", "121", { timeout: 15000 });
  await page.evaluate(() => scrollTo(0, 0));
  await expect(canvas).toHaveAttribute("data-frame", "001");
  expect(Number(await hero.getAttribute("data-sequence-retained"))).toBeLessThanOrEqual(12);
  expect(desktopFrames).toEqual([]);
});

test("desktop does not fetch mobile frames, and crossing the breakpoint switches sequences", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const mobileFrames: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/hero-frames-mobile-curls/")) mobileFrames.push(request.url());
  });
  await page.goto("/");
  const canvas = page.getByTestId("scroll-hero-canvas");
  await expect(page.getByTestId("scroll-hero")).toHaveAttribute("data-sequence-ready", "true");
  await expect(canvas).toHaveAttribute("data-sequence", "desktop");
  expect(mobileFrames).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toHaveAttribute("data-sequence", "mobile-curls");
  await expect(canvas).toHaveAttribute("data-frame", "001");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(canvas).toHaveAttribute("data-sequence", "desktop");
});

test("reduced motion keeps a still portrait without requesting the animation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const animationFrames: string[] = [];
  page.on("request", request => {
    if (/hero-frames-mobile-curls\/frame_(?!001)\d+\.webp/.test(request.url())) animationFrames.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator(".home-scroll-hero__poster")).toBeVisible();
  await expect(page.getByTestId("scroll-hero-canvas")).not.toHaveAttribute("data-sequence");
  expect(animationFrames).toEqual([]);
});

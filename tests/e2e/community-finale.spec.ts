import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 2013, height: 1604 }, { width: 1440, height: 900 }, { width: 1280, height: 600 }]) {
  test(`community holds, reveals, enlarges and releases at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const root = page.locator(".community-reveal");
    const scene = root.locator(".community-reveal__scene");
    await expect(scene).toHaveCount(1);
    await expect(root).toHaveAttribute("data-community-pin-end", /\d/);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
    const seek = async (progress: number) => {
      await root.evaluate((element, fraction) => {
        const start = Number(element.dataset.communityPinStart);
        const end = Number(element.dataset.communityPinEnd);
        window.scrollTo(0, start + (end - start) * fraction);
      }, progress);
      await expect.poll(() => root.evaluate(element => Number(element.dataset.communityProgress))).toBeCloseTo(progress, 2);
      // Wait for rendered progress, not a wall-clock delay: parallel browser
      // workers can throttle frames while numeric scrub is still catching up.
      await expect.poll(() => scene.evaluate((element, fraction) => {
        const sticky = element.parentElement!;
        const fitScale = Math.min((sticky.clientWidth - 48) / (element as HTMLElement).offsetWidth,
          (sticky.clientHeight - 64) / (element as HTMLElement).offsetHeight);
        const scale = new DOMMatrixReadOnly(getComputedStyle(element).transform).a;
        const expectedScale = fraction > 0.9 ? fitScale : Math.min(1, fitScale / 1.025);
        const tiles = [...element.querySelectorAll(".grid_item:not(.grid_item_middle)")];
        const photosReady = tiles.every(tile => fraction < 0.1
          ? Number(getComputedStyle(tile).opacity) === 0
          : Number(getComputedStyle(tile).opacity) > 0.999);
        return photosReady && Math.abs(scale - expectedScale) < 0.0005;
      }, progress)).toBe(true);
    };
    const geometry = () => root.evaluate(element => {
      const sticky = element.querySelector<HTMLElement>(".grid_sticky")!;
      const scene = element.querySelector<HTMLElement>(".community-reveal__scene")!;
      const grid = element.querySelector<HTMLElement>(".community-grid")!;
      const stickyRect = sticky.getBoundingClientRect();
      const sceneRect = scene.getBoundingClientRect();
      return {
        top: stickyRect.top, bottom: stickyRect.bottom,
        header: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")),
        left: sceneRect.left, right: sceneRect.right,
        sceneTop: sceneRect.top, sceneBottom: sceneRect.bottom,
        gridWidth: grid.getBoundingClientRect().width,
        allVisible: [...grid.children].every(tile => Number(getComputedStyle(tile).opacity) > 0.999),
        nextTop: document.querySelector(".faith-section")!.getBoundingClientRect().top,
      };
    });

    await seek(0.02);
    const intro = await geometry();
    expect(intro.top).toBeCloseTo(intro.header, 0);
    expect(intro.bottom).toBeCloseTo(viewport.height, 0);
    expect(intro.allVisible).toBe(false);

    await seek(0.69);
    const revealed = await geometry();
    expect(revealed.allVisible).toBe(true);
    expect(revealed.top).toBeCloseTo(revealed.header, 0);
    expect(revealed.nextTop).toBeGreaterThanOrEqual(viewport.height - 1);

    await seek(0.96);
    const expanded = await geometry();
    expect(expanded.allVisible).toBe(true);
    expect(expanded.gridWidth / revealed.gridWidth).toBeGreaterThan(1.024);
    expect(expanded.top).toBeCloseTo(expanded.header, 0);
    expect(expanded.nextTop).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(expanded.left).toBeGreaterThanOrEqual(20);
    expect(expanded.right).toBeLessThanOrEqual(viewport.width - 20);
    expect(expanded.sceneTop).toBeGreaterThanOrEqual(expanded.header + 28);
    expect(expanded.sceneBottom).toBeLessThanOrEqual(viewport.height - 28);
    // Fill one available dimension instead of leaving a small grid in the scene.
    expect(Math.min(expanded.left - 24, expanded.sceneTop - expanded.header - 32)).toBeLessThan(2);
    await mkdir("artifacts/qa", { recursive: true });
    await page.screenshot({ path: `artifacts/qa/community-finale-${viewport.width}.png` });

    await root.evaluate(element => window.scrollTo(0, Number(element.dataset.communityPinEnd) + 150));
    await expect.poll(async () => (await geometry()).top).toBeLessThan(expanded.header - 100);

    await seek(0.69);
    expect((await geometry()).gridWidth).toBeCloseTo(revealed.gridWidth, 0);
    await seek(0.02);
    expect((await geometry()).allVisible).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
  });
}

test("community finale refits after resize and removes desktop transforms on mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 2013, height: 1604 });
  await page.goto("/");
  const root = page.locator(".community-reveal");
  const scene = root.locator(".community-reveal__scene");
  await expect(root).toHaveAttribute("data-community-pin-end", /\d/);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  for (const viewport of [{ width: 2013, height: 1604 }, { width: 1280, height: 600 }]) {
    await page.setViewportSize(viewport);
    // Resize refresh is debounced and may take longer under parallel load.
    // Check the new measured range before seeking, otherwise the old tall-
    // viewport target can scroll past the entire section on a short viewport.
    await expect.poll(() => root.evaluate(element => {
      const sticky = element.querySelector<HTMLElement>(".grid_sticky")!;
      const header = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue("--site-header-height"));
      const start = Number(element.dataset.communityPinStart);
      const end = Number(element.dataset.communityPinEnd);
      const measuredStart = element.getBoundingClientRect().top + scrollY - header;
      return Math.abs(start - measuredStart) <= 1
        && Math.abs(end - start - ((element as HTMLElement).offsetHeight - sticky.offsetHeight)) <= 1;
    })).toBe(true);
    await root.evaluate(element => {
      const start = Number(element.dataset.communityPinStart);
      window.scrollTo(0, start + (Number(element.dataset.communityPinEnd) - start) * 0.96);
    });
    await expect.poll(() => root.evaluate(element => Number(element.dataset.communityProgress))).toBeCloseTo(0.96, 2);
    await expect.poll(() => scene.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 100 && rect.bottom <= innerHeight - 28
        && rect.left >= 20 && rect.right <= innerWidth - 20;
    })).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(scene).toHaveCSS("transform", "none");
  await expect(root).not.toHaveAttribute("data-community-pin-end", /\d/);
  await expect.poll(() => root.locator(".grid_item").evaluateAll(elements => elements.every(element => (
    getComputedStyle(element).visibility === "visible" && Number(getComputedStyle(element).opacity) === 1
  )))).toBe(true);
});

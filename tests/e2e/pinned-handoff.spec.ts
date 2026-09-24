import { expect, test } from "@playwright/test";

test("community reveal is visually primed in the server-rendered page", async ({ request }) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('class="community-reveal is-ready"');
});

test("community and Faith & Fitness pins never overlap during their handoff", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const community = page.locator(".community-reveal");
  const faith = page.getByTestId("faith-scroll-story");
  const faithPin = faith.locator(".faith-story__pin");

  await expect(community).toHaveAttribute("data-community-pin-end", /\d/);
  await expect(faith).toHaveAttribute("data-story-pin-start", /\d/);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });

  const readRanges = () => page.evaluate(() => {
    const communityElement = document.querySelector<HTMLElement>(".community-reveal");
    const faithElement = document.querySelector<HTMLElement>('[data-testid="faith-scroll-story"]');
    return {
      communityStart: Number(communityElement?.dataset.communityPinStart),
      communityEnd: Number(communityElement?.dataset.communityPinEnd),
      faithStart: Number(faithElement?.dataset.storyPinStart),
      faithEnd: Number(faithElement?.dataset.storyPinEnd),
    };
  });

  await expect.poll(async () => {
    const current = await readRanges();
    return current.faithStart - current.communityEnd;
  }).toBeGreaterThanOrEqual(0);

  const ranges = await readRanges();

  expect(ranges.communityEnd).toBeGreaterThan(ranges.communityStart);
  expect(ranges.faithEnd).toBeGreaterThan(ranges.faithStart);
  expect(ranges.faithStart).toBeGreaterThanOrEqual(ranges.communityEnd);

  await page.evaluate((position) => window.scrollTo(0, position), ranges.communityStart - 420);

  const samples: Array<{
    scrollY: number;
    communityPinned: boolean;
    faithFixed: boolean;
    headerHeight: number;
    communityTop: number;
    communityBottom: number;
    faithTop: number;
    faithBottom: number;
  }> = [];

  while ((await page.evaluate(() => window.scrollY)) < ranges.faithStart + 220) {
    await page.mouse.wheel(0, 180);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));

    samples.push(await page.evaluate(() => {
      const communityElement = document.querySelector<HTMLElement>(".grid_sticky")!;
      const faithElement = document.querySelector<HTMLElement>(".faith-story__pin")!;
      const communityRect = communityElement.getBoundingClientRect();
      const faithRect = faithElement.getBoundingClientRect();
      const headerHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--site-header-height"),
      ) || 76;
      return {
        scrollY: window.scrollY,
        headerHeight,
        communityPinned: getComputedStyle(communityElement).position === "sticky"
          && Math.abs(communityRect.top - headerHeight) <= 1,
        faithFixed: getComputedStyle(faithElement).position === "fixed",
        communityTop: communityRect.top,
        communityBottom: communityRect.bottom,
        faithTop: faithRect.top,
        faithBottom: faithRect.bottom,
      };
    }));

    if (samples.length === 5) {
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await page.waitForTimeout(300);
    }

    expect(samples.length).toBeLessThan(40);
  }

  for (const sample of samples) {
    if (sample.communityPinned) {
      expect(sample.scrollY).toBeGreaterThanOrEqual(ranges.communityStart - 1);
      expect(sample.scrollY).toBeLessThanOrEqual(ranges.communityEnd + 1);
    }
    if (sample.faithFixed) {
      expect(sample.scrollY).toBeGreaterThanOrEqual(ranges.faithStart - 1);
    }
    const scenesIntersect = sample.communityBottom > Math.max(sample.faithTop, sample.headerHeight) + 1
      && sample.faithBottom > Math.max(sample.communityTop, sample.headerHeight) + 1;
    expect(scenesIntersect, JSON.stringify(sample)).toBe(false);
    expect(sample.communityPinned && sample.faithFixed, JSON.stringify(sample)).toBe(false);
  }

  await expect(community.locator(".grid_item:not(.grid_item_middle)").first()).toHaveCSS("opacity", "1");
  await expect(community.locator(".community-reveal__caption")).toHaveText("Niet alleen bij Kratos");
  await expect(faithPin).toHaveCSS("position", "fixed");
  const headerHeight = await page.evaluate(() => Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--site-header-height"),
  ) || 76);
  await expect.poll(async () => Math.abs(
    (await faithPin.evaluate((element) => element.getBoundingClientRect().top)) - headerHeight,
  )).toBeLessThan(2);
  await expect(faith.locator(".faith-story__intro")).toBeInViewport();
});

test("community reveal keeps normal flow when crossing the desktop breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto("/");

  const community = page.locator(".community-reveal");
  const sticky = community.locator(".grid_sticky");
  const faith = page.getByTestId("faith-scroll-story");

  await expect(community).toHaveAttribute("data-community-pin-end", /\d/);
  await expect(sticky).toHaveCSS("position", "sticky");
  await expect.poll(() => community.evaluate((element) => (
    getComputedStyle(element).getPropertyValue("--community-pin-distance")
  ))).not.toBe("0px");
  await expect(faith).toHaveAttribute("data-story-mode", "pinned");

  await page.setViewportSize({ width: 800, height: 800 });
  await expect(sticky).toHaveCSS("position", "static");
  await expect.poll(() => community.evaluate((element) => (
    getComputedStyle(element).getPropertyValue("--community-pin-distance")
  ))).toBe("0px");
  await expect(faith).toHaveAttribute("data-story-mode", "static");
  await expect(page.locator(".pin-spacer-home-community-reveal")).toHaveCount(0);

  const mobileFlow = await page.evaluate(() => {
    const communityElement = document.querySelector<HTMLElement>(".community-reveal")!;
    const faithElement = document.querySelector<HTMLElement>('[data-testid="faith-scroll-story"]')!;
    return {
      communityBottom: communityElement.getBoundingClientRect().bottom + window.scrollY,
      faithTop: faithElement.getBoundingClientRect().top + window.scrollY,
    };
  });
  expect(mobileFlow.faithTop).toBeGreaterThanOrEqual(mobileFlow.communityBottom - 1);

  await page.setViewportSize({ width: 1000, height: 800 });
  await expect(sticky).toHaveCSS("position", "sticky");
  await expect.poll(() => community.evaluate((element) => (
    getComputedStyle(element).getPropertyValue("--community-pin-distance")
  ))).not.toBe("0px");
  await expect(faith).toHaveAttribute("data-story-mode", "pinned");
});

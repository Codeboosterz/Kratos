import { expect, test, type Page } from "@playwright/test";

const chapterTitles = [
  "Samenkomen",
  "Samen bewegen",
  "Elkaar aanmoedigen",
  "Geloof & inspiratie",
  "Nieuwe verbindingen",
  "De volgende editie",
] as const;
const photoChapters = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];

async function scrollStoryTo(page: Page, progress: number) {
  const story = page.getByTestId("faith-scroll-story");
  const range = await story.evaluate((element) => ({
    start: Number(element.dataset.storyPinStart),
    end: Number(element.dataset.storyPinEnd),
  }));

  expect(range.end - range.start).toBeGreaterThan(3_600);
  await page.evaluate(({ start, end, progress }) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, start + (end - start) * progress);
  }, { ...range, progress });
  await expect.poll(async () => Number(await story.getAttribute("data-story-progress"))).toBeGreaterThan(progress - 0.03);
}

test("Faith & Fitness keeps the rolling copy, filmstrip and stepper synchronized", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/community");

  const story = page.getByTestId("faith-scroll-story");
  const pin = story.locator(".faith-story__pin");
  const copyPanels = story.locator(".faith-story__copy-panel");
  const cards = story.locator(".faith-story__card");
  const track = story.locator(".faith-story__track");
  const filmstrip = story.locator(".faith-story__filmstrip");

  await expect(story).toHaveAttribute("data-story-mode", "pinned");
  await expect(story).toHaveAttribute("data-story-pin-start", /\d/);
  await expect(story).toHaveAttribute("data-story-pin-end", /\d/);
  await expect(copyPanels).toHaveCount(chapterTitles.length);
  await expect(cards).toHaveCount(photoChapters.length);
  await expect(story.locator(".faith-story__step")).toHaveCount(chapterTitles.length);
  await expect(story.locator(".faith-story__stepper button")).toHaveCount(0);
  await expect(filmstrip).toHaveCSS("overflow", "hidden");

  const geometry = await story.evaluate((element) => {
    const card = element.querySelector<HTMLElement>(".faith-story__card");
    const filmstrip = element.querySelector<HTMLElement>(".faith-story__filmstrip");
    const stepper = element.querySelector<HTMLElement>(".faith-story__stepper");
    return {
      cardHeight: card?.getBoundingClientRect().height ?? 0,
      filmstripHeight: filmstrip?.getBoundingClientRect().height ?? 0,
      stepperHeight: stepper?.getBoundingClientRect().height ?? 0,
    };
  });
  expect(geometry.cardHeight).toBeGreaterThan(420);
  expect(geometry.filmstripHeight).toBeGreaterThan(540);
  expect(geometry.stepperHeight).toBeGreaterThanOrEqual(34);

  let pinnedTop = 0;
  let previousTrackX = Number.POSITIVE_INFINITY;
  for (const index of photoChapters.keys()) {
    const chapter = photoChapters[index];
    const progress = (index + 0.75) / photoChapters.length;
    await scrollStoryTo(page, progress);
    await expect(story).toHaveAttribute("data-story-step", String(chapter + 1));
    await expect(story).toHaveAttribute("data-story-photo", String(index + 1));

    const activeCopy = copyPanels.nth(chapter);
    const activeCard = cards.nth(index);
    await expect(activeCopy).toHaveAttribute("data-story-active", "true");
    await expect(activeCard).toHaveAttribute("data-story-active", "true");
    await expect(activeCopy.locator("h4")).toHaveText(chapterTitles[chapter]);
    await expect(activeCard.locator("figcaption")).toContainText(chapterTitles[chapter]);
    await expect(story.locator(".faith-story__step").nth(chapter)).toHaveAttribute("aria-current", "step");
    await expect.poll(() => activeCard.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

    const fullyVisibleCopy = await copyPanels.evaluateAll((elements) => elements.filter((element) => {
      const style = getComputedStyle(element);
      return style.visibility !== "hidden" && Number(style.opacity) > 0.9;
    }).length);
    expect(fullyVisibleCopy).toBe(1);

    const cardState = await cards.evaluateAll((elements, activeIndex) => elements.map((element, cardIndex) => ({
      active: cardIndex === activeIndex,
      clipPath: getComputedStyle(element).clipPath,
      zIndex: Number(getComputedStyle(element).zIndex),
    })), index);
    expect(cardState[index].clipPath).toMatch(/0(?:px|%)/);
    expect(cardState[index].zIndex).toBeGreaterThan(Math.max(...cardState.filter((_, cardIndex) => cardIndex !== index).map((card) => card.zIndex)));

    const trackX = await track.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
    expect(trackX).toBeLessThanOrEqual(previousTrackX + 1);
    previousTrackX = trackX;

    const currentTop = await pin.evaluate((element) => element.getBoundingClientRect().top);
    if (index === 0) pinnedTop = currentTop;
    else expect(Math.abs(currentTop - pinnedTop)).toBeLessThan(2);
  }

  // Rewinding must restore the first chapter and its first photo as well.
  const start = Number(await story.getAttribute("data-story-pin-start"));
  await page.evaluate((y) => window.scrollTo(0, y), start + 1);
  await expect(story).toHaveAttribute("data-story-photo", "1");
  await expect(story.locator(".faith-story__step").first()).toHaveAttribute("aria-current", "step");

  const pinEnd = Number(await story.getAttribute("data-story-pin-end"));
  await page.evaluate((end) => window.scrollTo(0, end + 300), pinEnd);
  await expect.poll(async () => pinnedTop - await pin.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThan(100);
});

test("Faith & Fitness keeps the approved desktop filmstrip when reduced motion is enabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/community#faith-title");

  const story = page.getByTestId("faith-scroll-story");
  await expect(story).toHaveAttribute("data-story-mode", "pinned");
  await expect(story.locator(".faith-story__desktop-stage")).toHaveCSS("display", "grid");
  await expect(story.locator(".faith-story__mobile-chapters")).toHaveCSS("display", "none");
  await expect(story.locator(".faith-story__card")).toHaveCount(photoChapters.length);
  await expect(story.locator(".faith-story__copy-panel")).toHaveCount(chapterTitles.length);
});

test("Faith & Fitness mobile slides support forward, reverse and keyboard controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/community#faith-title");
  const story = page.getByTestId("faith-scroll-story");
  await expect(story.locator(".faith-story__mobile-chapter")).toHaveCount(6);
  await expect(story.locator(".faith-story__desktop-stage")).toHaveCSS("display", "none");
  for(let index=1;index<6;index++) {
    await story.getByRole("button", { name: "Volgende slide" }).click();
    await expect(story.locator(".faith-story__mobile-controls span")).toHaveText(`${index+1} / 6`);
  }
  await expect(story.getByRole("button", { name: "Volgende slide" })).toBeDisabled();
  for(let index=4;index>=0;index--) {
    await story.getByRole("button", { name: "Vorige slide" }).focus();
    await page.keyboard.press("Enter");
    await expect(story.locator(".faith-story__mobile-controls span")).toHaveText(`${index+1} / 6`);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

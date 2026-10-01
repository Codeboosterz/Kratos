import { expect, test } from '@playwright/test';

test('mobile hero supports forward and reverse image scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const hero = page.getByTestId('scroll-hero');
  await expect(hero).toHaveAttribute('data-sequence-ready', 'true');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const range = await hero.evaluate(e => ({ start: e.getBoundingClientRect().top + scrollY - 68, end: e.getBoundingClientRect().bottom + scrollY - innerHeight }));
  await page.evaluate(y => scrollTo(0,y), range.end);
  await expect.poll(() => page.getByTestId('scroll-hero-canvas').getAttribute('data-frame'), {timeout:15000}).toBe('121');
  await page.evaluate(() => scrollTo(0,0));
  await expect.poll(() => page.getByTestId('scroll-hero-canvas').getAttribute('data-frame')).toBe('001');
  await expect(hero.locator('.home-scroll-hero__copy')).toBeVisible();
});

test('Faith community is separate from the homepage coaching flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('faith-scroll-story')).toHaveCount(0);
  await page.goto('/community');
  await expect(page.getByRole('heading', { level:1 })).toHaveText(/FAITH\. FITNESS\.\s*COMMUNITY\./i);
  await expect(page.locator('main a[href*="source=community"]')).toHaveCount(0);
  await expect(page.locator('main a[href*="instagram.com"]')).toHaveCount(2);
});

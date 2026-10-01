import { expect, test } from "@playwright/test";

test("community reveal hands off to the coach section in both scroll directions", async ({ page }) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  const grid=page.locator('.community-reveal');
  await expect(grid).toHaveAttribute('data-community-pin-end', /\d/);
  await expect(page.getByTestId('faith-scroll-story')).toHaveCount(0);
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
  const end=Number(await grid.getAttribute('data-community-pin-end'));
  await page.evaluate(y=>scrollTo(0,y+800),end);
  await expect(page.locator('.omar-band')).toBeInViewport();
  await expect.poll(()=>grid.locator('.grid_sticky').evaluate(e=>e.getBoundingClientRect().bottom)).toBeLessThan(300);
  const start=Number(await grid.getAttribute('data-community-pin-start'));
  await page.evaluate(y=>scrollTo(0,y),start+1);
  await expect.poll(async()=>Number(await grid.getAttribute('data-community-progress'))).toBeLessThan(0.01);
});

test("community scene cleans up across responsive breakpoints", async ({page})=>{
  await page.setViewportSize({width:1440,height:900});await page.goto('/');
  const grid=page.locator('.community-reveal');
  await expect(grid).toHaveAttribute('data-community-pin-end', /\d/);
  await page.setViewportSize({width:390,height:844});
  await expect(grid.locator('.grid_sticky')).toHaveCSS('position','static');
  await expect(grid).not.toHaveAttribute('data-community-pin-end', /\d/);
  await page.setViewportSize({width:1440,height:900});
  await expect(grid).toHaveAttribute('data-community-pin-end', /\d/);
  await expect(grid.locator('.grid_sticky')).toHaveCSS('position','sticky');
});

import {expect,test} from '@playwright/test';

test('mobile image effects survive orientation and client navigation',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const hero=page.getByTestId('scroll-hero');
 await expect(hero).toHaveAttribute('data-sequence-ready','true');
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,450)});
 await expect.poll(async()=>Number(await page.getByTestId('scroll-hero-canvas').getAttribute('data-frame'))).toBeGreaterThan(10);
 await page.setViewportSize({width:844,height:390});
 await expect(hero).not.toHaveAttribute('data-sequence-ready','true');
 await expect(hero.locator('.home-scroll-hero__sticky')).toHaveCSS('position','relative');
 await page.setViewportSize({width:390,height:844});
 await expect(hero).toHaveAttribute('data-sequence-ready','true');
 await page.locator('footer a[href="/community"]').click();
 await expect(page).toHaveURL(/community/);
 await expect(page.getByTestId('scroll-hero')).toHaveCount(0);
 await page.goBack();
 await expect(hero).toHaveAttribute('data-sequence-ready','true');
 // Wait for history scroll restoration before testing a new user scroll.
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(400);
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";scrollTo({top:0,behavior:"instant"});});
 await expect.poll(()=>page.getByTestId('scroll-hero-canvas').getAttribute('data-frame')).toBe('001');
 await expect.poll(() => page.getByTestId('scroll-hero-canvas').evaluate((canvas: HTMLCanvasElement) => {
   const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
   return pixels.some((value, index) => index % 4 !== 3 && value > 40);
 })).toBe(true);
 await expect(hero.locator('.home-scroll-hero__copy')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

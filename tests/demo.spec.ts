import { test } from '@playwright/test';
const OUT = 'C:/Users/ragha/websight/demo-shots';
test('discover signals ui', async ({ page }) => {
  const { mkdirSync } = await import('fs');
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Discover")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/discover_signals.png`, fullPage: true });
  // Click the first signal to expand it
  await page.click('button:has-text("Broken scraper pain")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/discover_signal_expanded.png`, fullPage: true });
});

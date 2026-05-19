import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// These tests run against `npm run preview`, which serves the production
// build but WITHOUT PUBLIC_UMAMI_* env vars set. Per the Analytics.astro
// triple guard, the tracker tag MUST NOT be present and zero network
// requests MUST be made to umami.sinapsys.work. This is the contract.

test('no umami tracker script element on home or posts', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('script[src*="umami"]')).toHaveCount(0);

  await page.goto('/posts');
  await expect(page.locator('script[src*="umami"]')).toHaveCount(0);
});

test('zero network requests to umami.sinapsys.work after navigation', async ({ page }) => {
  const umamiRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('umami.sinapsys.work')) {
      umamiRequests.push(req.url());
    }
  });

  await page.goto('/');
  await page.goto('/posts');

  expect(umamiRequests, 'Expected zero umami requests in preview build').toHaveLength(0);
});

test('zero cookies in context after visiting three pages', async ({ page, context }) => {
  await page.goto('/');
  await page.goto('/posts');
  await page.goto('/privacidad');

  const cookies = await context.cookies();
  expect(cookies, 'Expected zero cookies after navigation').toHaveLength(0);
});

test('footer contains a single link to /privacidad', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('footer a[href="/privacidad"]');
  await expect(link).toHaveCount(1);
  await expect(link).toBeVisible();
});

// T4.4: verify the generated sitemap contains /privacidad. This reads the
// dist/ output directly — the build must have been run before these tests
// (playwright.config.ts runs `npm run preview`, which requires `npm run build`).
test('sitemap includes /privacidad', async () => {
  const sitemapPath = resolve(process.cwd(), 'dist', 'sitemap-0.xml');
  const xml = readFileSync(sitemapPath, 'utf8');
  expect(xml).toContain('https://daniel.sinapsys.work/privacidad');
});

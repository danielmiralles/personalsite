import { test, expect, ConsoleMessage } from '@playwright/test';

test('home page renders', async ({ page }) => {
  const consoleErrors: ConsoleMessage[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message);
    }
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/Daniel Miralles/);

  expect(consoleErrors, 'Expected no console errors on home page').toHaveLength(0);
});

test('internal nav links work', async ({ page }) => {
  await page.goto('/');

  const linkHandles = await page.locator('a[href^="/"]').elementHandles();
  const hrefs = new Set<string>();

  for (const handle of linkHandles) {
    const href = await handle.getAttribute('href');
    if (!href) continue;
    if (href === '/' || href.startsWith('/#') || href.startsWith('//')) continue;
    hrefs.add(href);
  }

  expect(hrefs.size).toBeGreaterThan(0);

  for (const href of hrefs) {
    const response = await page.goto(href);
    expect(response, `Expected a response for navigation to ${href}`).not.toBeNull();
    expect(response!.ok(), `Expected HTTP 2xx for ${href} but got ${response!.status()}`).toBeTruthy();

    const title = await page.title();
    expect(
      typeof title === 'string',
      `Expected a string title for ${href}, got ${typeof title}`,
    ).toBeTruthy();
  }
});

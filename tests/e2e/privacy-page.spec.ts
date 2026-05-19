import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('/privacidad renders required disclosure content', async ({ page }) => {
  const response = await page.goto('/privacidad');
  expect(response, 'Expected a response').not.toBeNull();
  expect(response!.ok(), `Expected 2xx, got ${response!.status()}`).toBeTruthy();

  const body = page.locator('body');
  // Required disclosures per spec
  await expect(body).toContainText('Umami');
  await expect(body).toContainText('sin cookies');
  await expect(body).toContainText(/DNT|Do Not Track/);
  await expect(body).toContainText("umami.disabled");
});

test('/privacidad has correct heading hierarchy', async ({ page }) => {
  await page.goto('/privacidad');

  // Exactly one h1
  await expect(page.locator('h1')).toHaveCount(1);

  // Collect headings in document order
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll(
    (els) => els.map((el) => el.tagName.toLowerCase()),
  );

  // No skipped levels — every h3 must be preceded somewhere by an h2,
  // every h4 by an h3 (or h2), etc. Walk the list and verify level only
  // increases by 1 from the running max-seen.
  const levels = headings.map((tag) => Number(tag.slice(1)));
  let maxSeen = 0;
  for (const level of levels) {
    if (level > maxSeen + 1 && maxSeen !== 0) {
      throw new Error(
        `Heading hierarchy skipped: jumped to h${level} after max-seen h${maxSeen}. Full order: ${headings.join(', ')}`,
      );
    }
    if (level > maxSeen) maxSeen = level;
  }
});

test('/privacidad passes axe-core with zero serious/critical violations', async ({ page }) => {
  await page.goto('/privacidad');

  // Scope to <main> — this change owns the privacy page content. Site-wide
  // chrome (nav, footer) is shared across all pages and out of scope for the
  // analytics+privacy change. Auditing the actual page content is what the
  // spec's a11y requirement targets.
  const results = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );

  expect(
    blocking,
    `Expected zero serious/critical a11y violations, got: ${JSON.stringify(blocking.map((v) => v.id), null, 2)}`,
  ).toHaveLength(0);
});

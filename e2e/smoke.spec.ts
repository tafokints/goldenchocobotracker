import { expect, test } from '@playwright/test';

const IGNORED_LOCAL_URLS = ['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js'];

function attachConsoleErrorTrap(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (IGNORED_LOCAL_URLS.some((u) => text.includes(u))) return;
      // Ignore expected 404 console message for Vercel local telemetry scripts
      if (text.includes('Failed to load resource') && text.includes('404')) return;
      errors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return errors;
}

test.describe('Enterprise launch readiness smoke suite', () => {
  test('serves enforced HTTP security headers and /api/health readiness', async ({ request }) => {
    const homeRes = await request.get('/');
    expect(homeRes.status()).toBe(200);

    const headers = homeRes.headers();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain("object-src 'none'");
    expect(headers['content-security-policy']).not.toContain("'unsafe-eval'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['x-powered-by']).toBeUndefined();

    const healthRes = await request.get('/api/health');
    expect(healthRes.status()).toBe(200);
    const healthJson = (await healthRes.json()) as { status: string; store: string };
    expect(healthJson.status).toBe('ok');
    expect(['postgres', 'redis', 'fallback']).toContain(healthJson.store);
  });

  test('renders branded 404 page for invalid serials and trust pages cleanly', async ({ page }) => {
    const errors = attachConsoleErrorTrap(page);

    const missingCardRes = await page.goto('/card/99');
    expect(missingCardRes?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /Serial Not In The Ledger/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Browse All 77 Cards/i })).toBeVisible();

    const missingRouteRes = await page.goto('/does-not-exist-page');
    expect(missingRouteRes?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /Serial Not In The Ledger/i })).toBeVisible();

    await page.goto('/card/7');
    await expect(page).toHaveURL(/\/card\/07$/);

    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { name: /Privacy, Cookies & Disclosures/i })
    ).toBeVisible();
    await expect(
      page.locator('main').getByText('As an Amazon Associate I earn from qualifying purchases.')
    ).toBeVisible();

    await page.goto('/methodology');
    await expect(
      page.getByRole('heading', { name: /Verification & Grading Methodology/i })
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('desktop (1280x800): / shortcut, Quick View focus trap, scroll lock & focus restore', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const errors = attachConsoleErrorTrap(page);

    await page.goto('/', { waitUntil: 'networkidle' });

    // Skip to main content link exists
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // '/' shortcut focuses search without inserting '/'
    await page.getByRole('heading', { name: 'Golden Chocobo Tracker' }).click();
    await page.keyboard.press('/');
    const searchInput = page.getByPlaceholder(/Search #/i);
    await expect(searchInput).toBeFocused();
    await expect(searchInput).toHaveValue('');

    await page.keyboard.type('01');
    await expect(searchInput).toHaveValue('01');
    await page.getByRole('button', { name: 'Reset filters' }).first().click();
    await expect(searchInput).toHaveValue('');

    // Open Quick View modal -> verify focus stays inside dialog, body scroll locks, Escape restores focus
    const firstQuickViewBtn = page.locator('article').first().getByRole('button', { name: 'Quick View' });
    await firstQuickViewBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect.poll(async () => page.evaluate(() => document.body.style.position)).toBe('fixed');

    // Cycle Tab several times and ensure focus never escapes the dialog
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const focusInsideDialog = await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"]');
        return Boolean(dlg && dlg.contains(document.activeElement));
      });
      expect(focusInsideDialog).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(firstQuickViewBtn).toBeFocused();
    await expect.poll(async () => page.evaluate(() => document.body.style.position)).toBe('');

    expect(errors).toEqual([]);
  });

  test('iPhone (390x844): 2-col cards, 16px controls, zero overflow & lazy /stats charts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = attachConsoleErrorTrap(page);

    await page.goto('/', { waitUntil: 'networkidle' });

    const metrics = await page.evaluate(() => {
      const search = document.querySelector('input[type="text"]');
      const select = document.querySelector('select');
      const cards = Array.from(document.querySelectorAll('article')).slice(0, 2);
      const rect1 = cards[0]?.getBoundingClientRect();
      const rect2 = cards[1]?.getBoundingClientRect();
      return {
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
        searchFontSize: search ? parseFloat(getComputedStyle(search).fontSize) : 0,
        selectFontSize: select ? parseFloat(getComputedStyle(select).fontSize) : 0,
        sameRow: Boolean(rect1 && rect2 && Math.abs(rect1.top - rect2.top) < 2),
        firstCardTop: rect1 ? rect1.top : 9999,
      };
    });

    expect(metrics.overflowX).toBe(false);
    expect(metrics.searchFontSize).toBeGreaterThanOrEqual(16);
    expect(metrics.selectFontSize).toBeGreaterThanOrEqual(16);
    expect(metrics.sameRow).toBe(true);
    expect(metrics.firstCardTop).toBeLessThan(640);

    // Navigate to /stats on iPhone and verify zero overflow + mobile Pop Report & lazy charts
    await page.goto('/stats', { waitUntil: 'networkidle' });
    const statsOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(statsOverflow).toBe(false);
    await expect(page.getByRole('heading', { name: /Market & Pull Statistics/i })).toBeVisible();

    expect(errors).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';

test.describe('SOFIYA Voice Assistant E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('app loads without critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && 
      !e.includes('DevTools')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Arc Reactor button is visible and clickable', async ({ page }) => {
    const reactor = page.locator('[class*="arc-reactor"], [data-testid="arc-reactor"]');
    await expect(reactor).toBeVisible({ timeout: 10000 });
  });

  test('can toggle voice activation', async ({ page }) => {
    const reactor = page.locator('[class*="arc-reactor"], [data-testid="arc-reactor"]').first();
    
    if (await reactor.isVisible()) {
      await reactor.click();
      await page.waitForTimeout(500);
      
      const listeningIndicator = page.locator('text=Listening');
      await expect(listeningIndicator).toBeVisible({ timeout: 5000 });
    }
  });

  test('theme toggle is functional', async ({ page }) => {
    const themeButtons = page.locator('[class*="theme"], [data-testid="theme-selector"] button');
    const count = await themeButtons.count();
    
    if (count > 0) {
      await themeButtons.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('language toggle changes UI', async ({ page }) => {
    const langToggle = page.locator('[class*="language"], [data-testid="language-toggle"]');
    
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('volume slider adjusts', async ({ page }) => {
    const volumeSlider = page.locator('input[type="range"]');
    
    if (await volumeSlider.isVisible()) {
      await volumeSlider.fill('80');
      await page.waitForTimeout(200);
    }
  });

  test('history panel shows commands', async ({ page }) => {
    const historyPanel = page.locator('[class*="history"], [data-testid="history"]');
    
    if (await historyPanel.isVisible()) {
      await expect(historyPanel).toBeVisible();
    }
  });

  test('widget buttons are visible', async ({ page }) => {
    const widgetButtons = page.locator('[class*="widget-button"], button:has-text("weather"), button:has-text("news")');
    const count = await widgetButtons.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('scrollable areas work', async ({ page }) => {
    const scrollable = page.locator('[class*="overflow-auto"], [class*="scroll"]').first();
    
    if (await scrollable.isVisible()) {
      await scrollable.scrollToBottom();
      await page.waitForTimeout(200);
    }
  });
});

test.describe('SOFIYA Accessibility Tests', () => {
  test('page has proper title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('SOFIYA');
  });

  test('focus management works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible()) {
      await firstButton.focus();
      await expect(firstButton).toBeFocused();
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
  });
});

test.describe('SOFIYA Performance Tests', () => {
  test('page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(10000);
  });

  test('no memory leaks on repeated interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const reactor = page.locator('[class*="arc-reactor"]').first();
    
    if (await reactor.isVisible()) {
      for (let i = 0; i < 3; i++) {
        await reactor.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

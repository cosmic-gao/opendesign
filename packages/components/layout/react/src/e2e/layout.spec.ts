import { test, expect } from '@playwright/test';

test.describe('Layout', () => {
  test('should render layout components', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.od-layout')).toBeVisible();
  });
});

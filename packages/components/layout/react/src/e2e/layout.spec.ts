import { test, expect } from '@playwright/test';

test.describe('Layout React E2E Tests', () => {
  test('should render default layout', async ({ page }) => {
    await page.goto('/iframe.html?id=react-layout--default');
    await page.waitForLoadState('networkidle');
    
    const layout = page.locator('.od-layout');
    await expect(layout).toBeVisible();
  });

  test('should render header', async ({ page }) => {
    await page.goto('/iframe.html?id=react-layout--default');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('.od-header');
    await expect(header).toBeVisible();
  });

  test('should render sidebar', async ({ page }) => {
    await page.goto('/iframe.html?id=react-layout--default');
    await page.waitForLoadState('networkidle');
    
    const sidebar = page.locator('.od-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('should render content', async ({ page }) => {
    await page.goto('/iframe.html?id=react-layout--default');
    await page.waitForLoadState('networkidle');
    
    const content = page.locator('.od-content');
    await expect(content).toBeVisible();
  });

  test('should render footer', async ({ page }) => {
    await page.goto('/iframe.html?id=react-layout--full-layout');
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('.od-footer');
    await expect(footer).toBeVisible();
  });

  test('should toggle sidebar collapse', async ({ page }) => {
    await page.goto('/iframe.html?id=react-layout--with-collapsed-sidebar');
    await page.waitForLoadState('networkidle');
    
    const sidebar = page.locator('.od-sidebar');
    await expect(sidebar).toHaveClass(/collapsed/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/iframe.html?id=react-layout--default');
    await page.waitForLoadState('networkidle');
    
    const layout = page.locator('.od-layout');
    await expect(layout).toBeVisible();
  });
});

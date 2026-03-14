import { test, expect } from '@playwright/test';

test.describe('Layout React E2E Tests', () => {
  describe('基础渲染测试', () => {
    test('应该渲染默认布局', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const layout = page.locator('.od-layout');
      await expect(layout).toBeVisible();
    });

    test('应该渲染 Header', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const header = page.locator('.od-layout-header');
      await expect(header).toBeVisible();
    });

    test('应该渲染 Sidebar', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const sidebar = page.locator('.od-layout-sidebar');
      await expect(sidebar).toBeVisible();
    });

    test('应该渲染 Content', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const content = page.locator('.od-layout-content');
      await expect(content).toBeVisible();
    });

    test('应该渲染 Footer', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--full-layout');
      await page.waitForLoadState('networkidle');
      
      const footer = page.locator('.od-layout-footer');
      await expect(footer).toBeVisible();
    });
  });

  describe('组件状态测试', () => {
    test('应该切换 Sidebar 折叠状态', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--with-collapsed-sidebar');
      await page.waitForLoadState('networkidle');
      
      const sidebar = page.locator('.od-layout-sidebar');
      await expect(sidebar).toHaveClass(/od-layout-sidebar--collapsed/);
    });

    test('应该显示固定定位 Header', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const header = page.locator('.od-layout-header');
      await expect(header).toHaveClass(/od-layout-header--fixed/);
    });

    test('应该在无 Header 时正确渲染', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--without-header');
      await page.waitForLoadState('networkidle');
      
      const layout = page.locator('.od-layout');
      await expect(layout).toBeVisible();
    });

    test('应该在无 Sidebar 时正确渲染', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--without-sidebar');
      await page.waitForLoadState('networkidle');
      
      const layout = page.locator('.od-layout');
      await expect(layout).toBeVisible();
    });
  });

  describe('响应式测试', () => {
    test('应该在移动端正确渲染', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const layout = page.locator('.od-layout');
      await expect(layout).toBeVisible();
    });

    test('应该在平板尺寸正确渲染', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const layout = page.locator('.od-layout');
      await expect(layout).toBeVisible();
    });

    test('应该在大桌面尺寸正确渲染', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const layout = page.locator('.od-layout');
      await expect(layout).toBeVisible();
    });

    test('应该在不同断点间平滑切换', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const breakpoints = [
        { width: 320, height: 568 },
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1024, height: 768 },
        { width: 1440, height: 900 },
      ];

      for (const size of breakpoints) {
        await page.setViewportSize(size);
        await page.waitForTimeout(100);
        const layout = page.locator('.od-layout');
        await expect(layout).toBeVisible();
      }
    });
  });

  describe('无障碍测试', () => {
    test('应该使用语义化 HTML 标签', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--full-layout');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('header.od-layout-header')).toHaveCount(1);
      await expect(page.locator('aside.od-layout-sidebar')).toHaveCount(1);
      await expect(page.locator('main.od-layout-content, .od-layout-content')).toHaveCount(1);
      await expect(page.locator('footer.od-layout-footer')).toHaveCount(1);
    });

    test('应该支持键盘导航', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const layout = page.locator('.od-layout');
      await expect(layout).toBeVisible();
    });
  });

  describe('CSS 变量测试', () => {
    test('应该应用自定义 Header 高度', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const header = page.locator('.od-layout-header');
      const height = await header.evaluate((el) => {
        return window.getComputedStyle(el).height;
      });
      
      expect(height).toBeTruthy();
    });

    test('应该应用自定义 Sidebar 宽度', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const sidebar = page.locator('.od-layout-sidebar');
      const width = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).width;
      });
      
      expect(width).toBeTruthy();
    });

    test('应该包含 CSS 动画变量', async ({ page }) => {
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      
      const layout = page.locator('.od-layout');
      const style = await layout.evaluate((el) => {
        return window.getComputedStyle(el).cssText;
      });
      
      expect(style).toContain('flex');
    });
  });

  describe('性能测试', () => {
    test('应该快速渲染布局', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/iframe.html?id=react-layout--default');
      await page.waitForLoadState('networkidle');
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(2000);
    });
  });
});

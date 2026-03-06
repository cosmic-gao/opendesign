import { describe, it, expect, beforeEach, vi } from 'vitest';
import { inject } from './inject';
import type { LayoutSizes } from '@openlayout/type';

describe('inject', () => {
  let mockDocument: Document;
  let mockHead: { appendChild: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockHead = { appendChild: vi.fn() };
    mockDocument = {
      getElementById: vi.fn(),
      createElement: vi.fn(),
      head: mockHead,
    } as unknown as Document;
  });

  describe('基础功能', () => {
    it('应正确注入固定值 CSS 变量', () => {
      const sizes: LayoutSizes = {
        header: 64,
        footer: 48,
        sidebar: 240,
      };

      const mockStyle = { textContent: '' };
      vi.mocked(mockDocument.getElementById).mockReturnValue(null);
      vi.mocked(mockDocument.createElement).mockReturnValue(mockStyle as unknown as HTMLStyleElement);

      inject(sizes, mockDocument);

      expect(mockDocument.createElement).toHaveBeenCalledWith('style');
      expect(mockStyle.textContent).toContain('--od-header-height: 64px');
      expect(mockStyle.textContent).toContain('--od-footer-height: 48px');
      expect(mockStyle.textContent).toContain('--od-sidebar-width: 240px');
    });

    it('应正确注入 auto CSS 变量', () => {
      const sizes: LayoutSizes = {
        header: 'auto',
        footer: 'auto',
        sidebar: 'auto',
      };

      const mockStyle = { textContent: '' };
      vi.mocked(mockDocument.getElementById).mockReturnValue(null);
      vi.mocked(mockDocument.createElement).mockReturnValue(mockStyle as unknown as HTMLStyleElement);

      inject(sizes, mockDocument);

      expect(mockStyle.textContent).toContain('--od-header-height: auto');
      expect(mockStyle.textContent).toContain('--od-footer-height: auto');
      expect(mockStyle.textContent).toContain('--od-sidebar-width: auto');
    });

    it('应正确处理对象形式的尺寸配置', () => {
      const sizes: LayoutSizes = {
        header: { min: 48, max: 120 },
        footer: { min: 32, max: 64 },
        sidebar: { min: 200, max: 400 },
      };

      const mockStyle = { textContent: '' };
      vi.mocked(mockDocument.getElementById).mockReturnValue(null);
      vi.mocked(mockDocument.createElement).mockReturnValue(mockStyle as unknown as HTMLStyleElement);

      inject(sizes, mockDocument);

      expect(mockStyle.textContent).toContain('--od-header-height: 48px');
      expect(mockStyle.textContent).toContain('--od-footer-height: 32px');
      expect(mockStyle.textContent).toContain('--od-sidebar-width: 200px');
    });
  });

  describe('SSR 支持', () => {
    it('无 document 时应直接返回', () => {
      const sizes: LayoutSizes = { header: 64 };

      inject(sizes, null as unknown as Document);

      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });
  });

  describe('DOM 操作', () => {
    it('style 元素已存在时应复用', () => {
      const sizes: LayoutSizes = { header: 64 };
      const existingStyle = { textContent: '', id: 'od-layout-variables' };

      vi.mocked(mockDocument.getElementById).mockReturnValue(existingStyle as unknown as HTMLStyleElement);

      inject(sizes, mockDocument);

      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(mockHead.appendChild).not.toHaveBeenCalled();
    });
  });
});

import { vi } from 'vitest';

const windowMock = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const documentMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(globalThis, 'window', {
  value: windowMock,
  writable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: documentMock,
  writable: true,
});

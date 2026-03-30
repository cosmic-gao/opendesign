import type { WebContainerConfig, WebContainerConfigResolved } from './types';
import { DEFAULT_CONFIG } from './constants';

export interface MergeOptions {
  deep?: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target } as T;
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (isObject(sourceValue) && isObject(targetValue)) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else if (sourceValue !== undefined) {
      (result as Record<string, unknown>)[key] = sourceValue;
    }
  }
  return result;
}

export function mergeConfig<VNode, CSSProperties>(
  config: WebContainerConfig<VNode, CSSProperties>,
  options?: MergeOptions
): WebContainerConfigResolved {
  const { deep = false } = options ?? {};

  if (deep) {
    return deepMerge(DEFAULT_CONFIG as unknown as Record<string, unknown>, {
      autoBoot: config.autoBoot,
      autoMount: config.autoMount,
      enableExit: config.enableExit,
    }) as unknown as WebContainerConfigResolved;
  }

  return {
    ...DEFAULT_CONFIG,
    autoBoot: config.autoBoot ?? DEFAULT_CONFIG.autoBoot,
    autoMount: config.autoMount ?? DEFAULT_CONFIG.autoMount,
    enableExit: config.enableExit ?? DEFAULT_CONFIG.enableExit,
  };
}

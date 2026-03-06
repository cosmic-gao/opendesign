/**
 * OpenDesign Layout 互斥断点检测
 * 基于 @nanostores/media-query 实现
 */

import { fromMediaQuery } from '@nanostores/media-query';
import type { Breakpoints } from '@openlayout/type';

interface MediaResult {
  getBreakpoint: () => string | null;
  subscribe: (callback: (breakpoint: string | null) => void) => () => void;
}

function createQueries(bp: Breakpoints): Record<string, string> {
  const keys = Object.keys(bp)
    .filter(k => bp[k] !== undefined)
    .sort((a, b) => (bp[a] ?? 0) - (bp[b] ?? 0));

  if (keys.length === 0) return {};

  const queries: Record<string, string> = {};

  queries[keys[0]] = `(max-width: ${bp[keys[0]]}px)`;

  for (let i = 1; i < keys.length - 1; i++) {
    queries[keys[i]] = `(min-width: ${bp[keys[i - 1]]! + 1}px) and (max-width: ${bp[keys[i]]}px)`;
  }

  if (keys.length > 1) {
    const lastKey = keys[keys.length - 1]!;
    queries[lastKey] = `(min-width: ${bp[lastKey]}px)`;
  }

  return queries;
}

export function createMedia(breakpoints: Breakpoints): MediaResult {
  const queries = createQueries(breakpoints);
  const stores = Object.entries(queries).map(([key, query]) => ({
    key,
    store: fromMediaQuery(query),
  }));

  return {
    getBreakpoint: (): string | null => {
      for (const { key, store } of stores) {
        if (store.get()) {
          return key;
        }
      }
      const keys = Object.keys(queries);
      const sortedKeys = keys.sort((a, b) => (breakpoints[b] ?? 0) - (breakpoints[a] ?? 0));
      return sortedKeys[0] ?? null;
    },
    subscribe: (callback: (breakpoint: string | null) => void) => {
      const unsubscribes = stores.map(({ key, store }) =>
        store.subscribe((matches) => {
          if (matches) {
            callback(key);
          }
        })
      );
      return () => unsubscribes.forEach((fn) => fn());
    },
  };
}

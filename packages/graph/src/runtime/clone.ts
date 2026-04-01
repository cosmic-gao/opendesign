export const cloneValue = <T>(value: T): T => {
  const globalClone = (globalThis as unknown as {
    structuredClone?: <V>(input: V) => V;
  }).structuredClone;

  if (typeof globalClone === 'function') {
    return globalClone(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

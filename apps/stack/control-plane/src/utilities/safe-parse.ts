export const safeParse = <T = object>(
  value: unknown,
): { success: true; data: T } | { success: false; error: Error } => {
  try {
    const parsed = JSON.parse(value as string);
    return { success: true, data: parsed as T };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

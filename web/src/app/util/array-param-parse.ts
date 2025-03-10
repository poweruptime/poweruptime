export function paramToArray<T>(options?: {defaultValue?: T[]}): (value: string | null) => T[] {
  const defaultValue = options?.defaultValue ?? [];
  return (value: string | null) =>
    (value === '' ? defaultValue : (value?.split(',').map((x) => x.trim()) ?? defaultValue)) as T[];
}

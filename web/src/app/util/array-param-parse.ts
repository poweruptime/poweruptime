export function paramToArray<T>(options?: {defaultValue?: T[]}): (value: string | null) => T[] {
  const defaultValue = options?.defaultValue ?? [];
  return (value: string | null) =>
    (value === '' ? defaultValue : (value?.split(',').map((x) => x.trim()) ?? defaultValue)) as T[];
}

export function arrayToParam<T = string>(
  {
    separator = ',',
    skipEmpty = true,
    stringify,
  }: {
    separator?: string;
    skipEmpty?: boolean;
    stringify?: (value: T) => string;
  } = {separator: ',', skipEmpty: true},
): (value: T[]) => string | null {
  return (value: T[]) => {
    if (!value?.length) {
      return null;
    }

    return value
      .filter((x) => (skipEmpty ? !!x : true))
      .map((x) => (stringify ? stringify(x) : x))
      .join(separator);
  };
}

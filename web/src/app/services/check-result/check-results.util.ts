import type {BackendType} from '@app/api';

type CheckResult = BackendType['CheckResultResponse'];

/** Reconcile a snapshot with events received while the request was in flight. */
export function reconcileCheckResults(
  snapshot: CheckResult[],
  current: CheckResult[],
  updates: Iterable<CheckResult>,
): CheckResult[] {
  const currentById = new Map(current.map((result) => [result.id, result]));
  const results = new Map(
    snapshot.map((result) => {
      const existing = currentById.get(result.id);
      // A check cannot go back to pending after it has finished.
      return [
        result.id,
        result.status === 'PENDING' && existing && existing.status !== 'PENDING'
          ? existing
          : result,
      ];
    }),
  );
  for (const result of updates) {
    results.set(result.id, result);
  }
  return [...results.values()];
}

const FRACTIONAL_SECONDS = /\.(\d+)/;

/** Compare ISO timestamps chronologically, including digits beyond millisecond precision. */
export function compareTimestamps(a: string, b: string): number {
  const diff = Date.parse(a) - Date.parse(b);
  if (diff !== 0) return diff;
  const fractionA = (FRACTIONAL_SECONDS.exec(a)?.[1] ?? '').padEnd(9, '0');
  const fractionB = (FRACTIONAL_SECONDS.exec(b)?.[1] ?? '').padEnd(9, '0');
  return fractionA < fractionB ? -1 : fractionA > fractionB ? 1 : 0;
}

export function newestCheckResults(results: CheckResult[], size: number): CheckResult[] {
  return results.sort((a, b) => compareTimestamps(b.createdAt, a.createdAt)).slice(0, size);
}

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

export function newestCheckResults(results: CheckResult[], size: number): CheckResult[] {
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, size);
}

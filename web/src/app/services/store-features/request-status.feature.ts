import {computed} from '@angular/core';

import {signalStoreFeature, withComputed, withState} from '@ngrx/signals';

export type RequestStatus =
  | 'idle'
  | 'pending'
  | 'fulfilled'
  | {codeName?: string; httpCode: number; message?: string};
export type RequestStatusState = {requestStatus: RequestStatus};

export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({requestStatus: 'idle'}),
    withComputed(({requestStatus}) => ({
      isPending: computed(() => requestStatus() === 'pending'),
      isFulfilled: computed(() => requestStatus() === 'fulfilled'),
      error: computed(() => {
        const status = requestStatus();
        return typeof status === 'object' ? status : null;
      }),
    })),
  );
}

export function setPending(): RequestStatusState {
  return {requestStatus: 'pending'};
}

export function setFulfilled(): RequestStatusState {
  return {requestStatus: 'fulfilled'};
}

export function setError(error: any): RequestStatusState {
  return {
    requestStatus: {
      codeName: error.error.codeName,
      httpCode: error.status,
      message: error.error?.message,
    },
  };
}

import {signal} from '@angular/core';

import {createInjectable} from 'ngxtension/create-injectable';

export const BackendOfflineService = createInjectable(() => {
  const isOffline = signal(false);
  return {
    isOffline: isOffline,
    set: (it: boolean): void => isOffline.set(it),
  };
});

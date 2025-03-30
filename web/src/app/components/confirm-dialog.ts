import {inject} from '@angular/core';

import {Observable, filter} from 'rxjs';

import {MtxDialog} from '@ng-matero/extensions/dialog';

export function injectConfirmDialog$() {
  const mtxDialog = inject(MtxDialog);

  return (title: string, description?: string) =>
    new Observable<boolean>((observer) => {
      mtxDialog.confirm(
        title,
        description,
        () => observer.next(true),
        () => observer.next(false),
      );
    }).pipe(filter((it) => it));
}

import {inject} from '@angular/core';

import {Observable, filter} from 'rxjs';

import {TranslocoService} from '@jsverse/transloco';
import {MtxDialog} from '@ng-matero/extensions/dialog';

export function injectDeleteConfirmDialog(confirm: (id: string) => void) {
  const mtxDialog = inject(MtxDialog);
  const translate = inject(TranslocoService);

  return {
    confirm: (id: string) =>
      mtxDialog.confirm(translate.translate('general.confirmDelete'), '', () => confirm(id)),
  };
}

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

import {inject} from '@angular/core';

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

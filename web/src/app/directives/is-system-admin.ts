import {NgIf} from '@angular/common';
import {Directive, effect, inject} from '@angular/core';

import {ProfileStore} from '@app/services';

@Directive({
  selector: '[isSystemAdmin]',
  hostDirectives: [
    {
      directive: NgIf,
      inputs: ['ngIfElse: isSystemAdminElse'],
    },
  ],
})
export class IsSystemAdmin {
  constructor() {
    const ngIfDirective = inject(NgIf);
    const profileStore = inject(ProfileStore);

    effect(() => {
      ngIfDirective.ngIf = profileStore.role() === 'ADMIN';
    });
  }
}

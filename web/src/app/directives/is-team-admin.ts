import {NgIf} from '@angular/common';
import {Directive, effect, inject} from '@angular/core';

import {SelectedTeamStore} from '@app/services';

@Directive({
  selector: '[isTeamAdmin]',
  hostDirectives: [
    {
      directive: NgIf,
      inputs: ['ngIfElse: isSystemAdminElse'],
    },
  ],
})
export class IsTeamAdmin {
  constructor() {
    const ngIfDirective = inject(NgIf);
    const selectedTeamStore = inject(SelectedTeamStore);

    effect(() => {
      ngIfDirective.ngIf = selectedTeamStore.selectedTeam()?.role === 'ADMIN';
    });
  }
}

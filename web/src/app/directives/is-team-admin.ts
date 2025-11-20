import {NgIf} from '@angular/common';
import {Directive, effect, inject, input} from '@angular/core';

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
  teamId = input<string | undefined>(undefined, {
    alias: 'isTeamAdmin',
  });

  constructor() {
    const ngIfDirective = inject(NgIf);
    const selectedTeamStore = inject(SelectedTeamStore);

    effect(() => {
      ngIfDirective.ngIf = selectedTeamStore.selectedTeam()?.role === 'ADMIN';
    });
  }
}

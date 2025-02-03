import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {EmailChangeStore} from '@app/services';

@Component({
  template: `
    <p>Redirecting...</p>
  `,
  selector: 'pu-email-change-confirm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EmailChangeStore],
  imports: [],
})
export class EmailChangeConfirmPage {
  private readonly emailChangeStore = inject(EmailChangeStore);
  readonly confirmToken = input.required<string>();

  constructor() {
    this.emailChangeStore.confirm(this.confirmToken);
  }
}

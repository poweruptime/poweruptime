import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {EmailChangeStore} from '@app/services';

@Component({
  template: `
    <p>Redirecting...</p>
  `,
  selector: 'pu-email-change-undo-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EmailChangeStore],
  imports: [],
})
export class EmailChangeUndoPage {
  private readonly emailChangeStore = inject(EmailChangeStore);
  readonly cancelToken = input.required<string>();

  constructor() {
    this.emailChangeStore.undo(this.cancelToken);
  }
}

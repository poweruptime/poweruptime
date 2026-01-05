import {ChangeDetectionStrategy, Component, booleanAttribute, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

import {EmailChangeStore} from '@app/services';

@Component({
  template: `
    <div class="flex h-screen items-center">
      <div class="w-full text-center">
        <h1 class="text-6xl">{{ 'general.redirecting' | transloco }}</h1>
      </div>
    </div>
  `,
  selector: 'pu-email-change-undo-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EmailChangeStore],
  imports: [TranslocoPipe],
})
export class EmailChangeUndoPage {
  private readonly emailChangeStore = inject(EmailChangeStore);
  readonly cancelToken = input.required<string>();

  protected readonly preview = input(false, {transform: booleanAttribute});

  constructor() {
    if (!this.preview()) {
      this.emailChangeStore.undo(this.cancelToken);
    }
  }
}

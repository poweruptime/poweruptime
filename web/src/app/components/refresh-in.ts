import {DatePipe, isPlatformBrowser} from '@angular/common';
import {ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Meta} from '@angular/platform-browser';

import {map, of, timer} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';

const refreshInSeconds = 120;

@Component({
  template: `
    <div class="flex flex-col items-center py-4">
      <span>
        {{ 'refreshIn.lastUpdate' | transloco: {value: now | date: 'YYYY.MM.dd HH:mm:ss'} }}
      </span>
      <span>{{ 'refreshIn.refreshIn' | transloco: {value: countdown()} }}</span>
    </div>
  `,
  selector: 'refresh-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TranslocoPipe],
})
export class RefreshInComponent {
  private readonly meta = inject(Meta);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly now = new Date();

  countdown = toSignal(
    this.isBrowser
      ? timer(0, 1000).pipe(map((tick) => refreshInSeconds - (tick % refreshInSeconds)))
      : of(refreshInSeconds),
  );

  constructor() {
    if (!this.isBrowser) {
      this.meta.addTag({
        'http-equiv': 'refresh',
        content: `${refreshInSeconds}`,
      });
    }

    inject(DestroyRef).onDestroy(() => this.meta.removeTag('http-equiv'));
  }
}

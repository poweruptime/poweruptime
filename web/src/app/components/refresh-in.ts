import {DatePipe, isPlatformBrowser} from '@angular/common';
import {ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Meta} from '@angular/platform-browser';

import {map, of, timer} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';

@Component({
  template: `
    <div class="flex flex-col items-center py-4">
      <span>
        {{ 'refreshIn.lastUpdate' | transloco: {value: now | date: 'yyyy.MM.dd HH:mm:ss'} }}
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

  protected readonly refreshInSeconds = 120;

  countdown = toSignal(
    this.isBrowser
      ? timer(0, 1000).pipe(
          map((tick) => this.refreshInSeconds - (tick % this.refreshInSeconds)),
          map((tick) => tick.toString()),
        )
      : of(this.refreshInSeconds.toString()),
  );

  constructor() {
    if (!this.isBrowser) {
      this.meta.addTag({
        'http-equiv': 'refresh',
        content: `${this.refreshInSeconds}`,
      });
    }

    inject(DestroyRef).onDestroy(() => this.meta.removeTag('http-equiv'));
  }
}

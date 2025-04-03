import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'pu-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  host: {
    class: 'animate-pulse rounded bg-slate-400 dark:bg-slate-700;',
  },
})
export class Placeholder {}

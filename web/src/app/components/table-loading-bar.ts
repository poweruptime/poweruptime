import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {MatProgressBar} from '@angular/material/progress-bar';

@Component({
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    } @else {
      <div class="h-[4px] w-full"></div>
    }
  `,
  selector: 'pu-table-loading-bar',
  imports: [MatProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableLoadingBar {
  loading = input.required<boolean>();
}

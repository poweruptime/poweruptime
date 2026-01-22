import {ChangeDetectionStrategy, Component, input} from '@angular/core';


import { HlmProgressImports} from '@spartan-ng/helm/progress';

@Component({
  template: `
    @if (loading()) {
      <hlm-progress>
        <hlm-progress-indicator />
      </hlm-progress>
    } @else {
      <div class="h-2 w-full"></div>
    }
  `,
  selector: 'pu-table-loading-bar',
  imports: [HlmProgressImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableLoadingBar {
  loading = input.required<boolean>();
}

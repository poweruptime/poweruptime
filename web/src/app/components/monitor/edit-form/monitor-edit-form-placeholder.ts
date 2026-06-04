import {ChangeDetectionStrategy, Component} from '@angular/core';

import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

@Component({
  template: `
    <div class="grid gap-8 lg:grid-cols-3">
      <div class="grid grid-cols-6 gap-8 lg:col-span-2">
        <hlm-skeleton class="col-span-6 h-80" />
        <hlm-skeleton class="col-span-6 h-64" />
        <hlm-skeleton class="col-span-6 h-64" />
      </div>

      <div class="flex flex-col gap-8 lg:col-span-1">
        <hlm-skeleton class="h-48 w-full" />
        <hlm-skeleton class="h-40 w-full" />
      </div>
    </div>
  `,
  selector: 'pu-monitor-edit-form-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmSkeletonImports],
})
export class MonitorEditFormPlaceholder {}

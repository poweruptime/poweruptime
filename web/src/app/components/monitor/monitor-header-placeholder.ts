import {Component} from '@angular/core';

import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <hlm-skeleton class="h-8 w-1/2" />

      <div class="flex gap-4">
        <hlm-skeleton class="h-8 w-20" />
        <hlm-skeleton class="h-8 w-20" />
        <hlm-skeleton class="h-8 w-20" />
      </div>

      <hlm-skeleton class="h-44 w-full" />
    </div>
  `,
  selector: 'pu-monitor-header-placeholder',
  standalone: true,
  imports: [HlmSkeletonImports],
})
export class MonitorHeaderPlaceholder {}

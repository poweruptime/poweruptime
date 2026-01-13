import {ChangeDetectionStrategy, Component} from '@angular/core';

import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex gap-2">
        <hlm-skeleton class="h-12 w-64" />
        <hlm-skeleton class="h-12 w-64" />
        <hlm-skeleton class="h-12 w-64" />
      </div>
      <hlm-skeleton class="h-12 w-96" />
      <div class="flex gap-2">
        <hlm-skeleton class="h-12 w-64" />
        <hlm-skeleton class="h-12 w-64" />
      </div>
      <hlm-skeleton class="h-12 w-64" />
      <hlm-skeleton class="h-24 w-full" />
      <hlm-skeleton class="h-12 w-72" />
      <div class="flex gap-2">
        <hlm-skeleton class="h-12 w-64" />
        <hlm-skeleton class="h-12 w-64" />
      </div>
      <hlm-skeleton class="h-12 w-72" />
      <hlm-skeleton class="h-12 w-64" />
      <hlm-skeleton class="h-24 w-full" />
      <hlm-skeleton class="h-12 w-72" />
      <div class="flex gap-2">
        <hlm-skeleton class="h-12 w-64" />
        <hlm-skeleton class="h-12 w-64" />
        <hlm-skeleton class="h-12 w-64" />
      </div>
      <hlm-skeleton class="h-20 w-44" />
    </div>
  `,
  selector: 'pu-monitor-edit-form-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmSkeletonImports],
})
export class MonitorEditFormPlaceholder {}

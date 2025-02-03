import {ChangeDetectionStrategy, Component} from '@angular/core';

import {Placeholder} from '@app/components';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex gap-2">
        <pu-placeholder class="h-12 w-64" />
        <pu-placeholder class="h-12 w-64" />
        <pu-placeholder class="h-12 w-64" />
      </div>
      <pu-placeholder class="h-12 w-96" />
      <div class="flex gap-2">
        <pu-placeholder class="h-12 w-64" />
        <pu-placeholder class="h-12 w-64" />
      </div>
      <pu-placeholder class="h-12 w-64" />
      <pu-placeholder class="h-24 w-full" />
      <pu-placeholder class="h-12 w-72" />
      <div class="flex gap-2">
        <pu-placeholder class="h-12 w-64" />
        <pu-placeholder class="h-12 w-64" />
      </div>
      <pu-placeholder class="h-12 w-72" />
      <pu-placeholder class="h-12 w-64" />
      <pu-placeholder class="h-24 w-full" />
      <pu-placeholder class="h-12 w-72" />
      <div class="flex gap-2">
        <pu-placeholder class="h-12 w-64" />
        <pu-placeholder class="h-12 w-64" />
        <pu-placeholder class="h-12 w-64" />
      </div>
      <pu-placeholder class="h-20 w-44" />
    </div>
  `,
  selector: 'pu-monitor-edit-form-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Placeholder],
})
export class MonitorEditFormPlaceholder {}

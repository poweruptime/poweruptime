import {Component} from '@angular/core';

import {Placeholder} from '@app/components';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <pu-placeholder class="h-12 w-64" />
        <pu-placeholder class="h-12 w-12" />
      </div>

      <pu-placeholder class="h-8 w-1/2" />

      <div class="flex gap-4">
        <pu-placeholder class="h-8 w-20" />
        <pu-placeholder class="h-8 w-20" />
        <pu-placeholder class="h-8 w-20" />
      </div>

      <pu-placeholder class="h-44 w-full" />
    </div>
  `,
  selector: 'pu-monitor-header-placeholder',
  standalone: true,
  imports: [Placeholder],
})
export class MonitorHeaderPlaceholder {}

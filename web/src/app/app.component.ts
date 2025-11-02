import {UpperCasePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {NgxSonnerToaster} from 'ngx-sonner';

import {environment} from '@app/util';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-sonner-toaster duration="5000" visibleToasts="6" />
    <router-outlet />
    @if (isBetaOrDev) {
      <div class="pointer-events-none fixed right-0 bottom-0 z-50">
        <div class="relative">
          <div
            class="h-0 w-0 border-b-[60px] border-l-[60px] border-b-blue-500 border-l-transparent"></div>
          <span
            class="absolute right-2 bottom-2 -rotate-45 transform ps-2 pt-2 text-xs font-bold text-white">
            {{ channel | uppercase }}
          </span>
        </div>
      </div>
    }
  `,
})
export class AppComponent {
  protected readonly isBetaOrDev = environment.isBetaOrDevChannel;
  protected readonly channel = environment.channel;
}

import {isPlatformBrowser} from '@angular/common';
import {ChangeDetectionStrategy, Component, PLATFORM_ID, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RouterOutlet} from '@angular/router';

import {NgxSonnerToaster} from 'ngx-sonner';

import {JsonService} from './services/json.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-sonner-toaster duration="5000" visibleToasts="6" />
    <router-outlet />
  `,
})
export class AppComponent {
  constructor() {
    const jsonService = inject(JsonService);
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    // HAS TO BE ON BROWSER!?!?
    // IF NOT -> BUILD CRASH
    if (isBrowser) {
      jsonService.json$.pipe(takeUntilDestroyed()).subscribe();
    }
  }
}

import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
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
    inject(JsonService)
      .pipe(takeUntilDestroyed())
      .subscribe((response) => {
        console.log(`Running poweruptime-web-${response.version}`);
      });
  }
}

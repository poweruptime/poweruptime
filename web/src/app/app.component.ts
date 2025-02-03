import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {NgxSonnerToaster} from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-sonner-toaster duration="5000" visibleToasts="6" />
    <router-outlet />
  `,
})
export class AppComponent {}

import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* Apply flex styling to the parent container */
    :host {
      display: flex;
      flex-direction: column;
      min-height: 95vh;
    }

    /* Make the router-outlet take up available space */
    .layout {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `,
  template: `
    <div class="layout">
      <router-outlet />
    </div>
  `,
  imports: [RouterOutlet],
})
export class AuthLayout {}

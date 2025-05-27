import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatTabLink, MatTabNav, MatTabNavPanel} from '@angular/material/tabs';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';

import {environment} from '../../../../environments/environment';

@Component({
  template: `
    <nav [tabPanel]="tabPanel" mat-tab-nav-bar mat-stretch-tabs="false" mat-align-tabs="start">
      @for (route of routes; track route.path) {
        <a
          #rla="routerLinkActive"
          [active]="rla.isActive"
          [routerLink]="route.path"
          routerLinkActive
          mat-tab-link>
          {{ route.text | transloco }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #tabPanel>
      <div class="pt-2">
        <router-outlet />
      </div>
    </mat-tab-nav-panel>
  `,
  selector: 'instance-settings-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabNav,
    MatTabLink,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatTabNavPanel,
    TranslocoPipe,
  ],
})
export class ProfileLayout {
  /**
   * t(general.overview)
   * t(general.security)
   * t(profile.devThings)
   */
  readonly routes = [
    {path: 'overview', text: 'general.overview'},
    {path: 'security', text: 'general.security'},
    ...(environment.production ? [] : [{path: 'dev', text: 'profile.devThings'}]),
  ];
}

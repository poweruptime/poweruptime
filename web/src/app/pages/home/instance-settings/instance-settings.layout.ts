import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

import {MatTabLink, MatTabNav, MatTabNavPanel} from '@angular/material/tabs';

import {TranslocoPipe} from '@jsverse/transloco';

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
export class InstanceSettingsLayout {
  /**
   * t(general.teams, general.users, general.overview)
   */
  readonly routes = [
    {path: 'overview', text: 'general.overview'},
    {path: 'users', text: 'general.users'},
    {path: 'teams', text: 'general.teams'},
  ];
}

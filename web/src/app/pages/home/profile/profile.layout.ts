import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatTabLink, MatTabNav, MatTabNavPanel} from '@angular/material/tabs';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

import {environment} from '../../../../environments/environment';

@Component({
  template: `
    <h1 class="text-2xl">Settings</h1>
    <nav [tabPanel]="tabPanel" mat-tab-nav-bar mat-stretch-tabs="false" mat-align-tabs="start">
      @for (route of routes; track route.path) {
        <a
          #rla="routerLinkActive"
          [active]="rla.isActive"
          [routerLink]="route.path"
          routerLinkActive
          mat-tab-link>
          {{ route.text }}
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
  imports: [MatTabNav, MatTabLink, RouterLink, RouterLinkActive, RouterOutlet, MatTabNavPanel],
})
export class ProfileLayout {
  readonly routes = [
    {path: 'overview', text: 'Overview'},
    {path: 'security', text: 'Security'},
    ...(environment.production ? [] : [{path: 'dev', text: 'Dev things'}]),
  ];
}

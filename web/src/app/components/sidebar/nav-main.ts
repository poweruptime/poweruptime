import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmSidebarImports, HlmSidebarService} from '@spartan-ng/helm/sidebar';

import {SelectedTeamStore} from '@app/services';

@Component({
  template: `
    <hlm-sidebar-group>
      <ul hlmSidebarMenu>
        <li hlmSidebarMenuItem>
          <a
            #rlaPersonal="routerLinkActive"
            [isActive]="rlaPersonal.isActive"
            [routerLink]="sidebarService.isMobile() ? '/mm' : '/m'"
            hlmSidebarMenuButton
            routerLinkActive>
            <ng-icon name="bootstrapLightning" />
            {{ 'nav.personalDashboard' | transloco }}
          </a>
          <a
            #rlaTeams="routerLinkActive"
            [routerLinkActiveOptions]="{exact: true}"
            [isActive]="rlaTeams.isActive"
            hlmSidebarMenuButton
            routerLinkActive
            routerLink="/t">
            <ng-icon name="bootstrapPeople" />
            {{ 'general.teams' | transloco }}
          </a>
        </li>
      </ul>
    </hlm-sidebar-group>
  `,
  selector: 'nav-main',
  imports: [HlmSidebarImports, NgIcon, RouterLink, RouterLinkActive, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavMain {
  protected readonly sidebarService = inject(HlmSidebarService);
  protected readonly selectedTeamStore = inject(SelectedTeamStore);
}

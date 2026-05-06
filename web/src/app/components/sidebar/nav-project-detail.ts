import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmSidebarImports} from '@spartan-ng/helm/sidebar';

import {BackendType} from '@app/api';
import {IsTeamAdmin} from '@app/directives';
import {SelectedTeamStore} from '@app/services';

@Component({
  template: `
    @let _selectedTeam = selectedTeam();

    <hlm-sidebar-group>
      <div hlmSidebarGroupLabel>
        <span class="max-w-52 truncate">
          {{ _selectedTeam.name }}
        </span>
      </div>
      <ul hlmSidebarMenu>
        <li hlmSidebarMenuItem>
          <a
            #notRla="routerLinkActive"
            [isActive]="notRla.isActive"
            hlmSidebarMenuButton
            routerLink="/t/{{ selectedTeamId() }}/notification-methods"
            routerLinkActive>
            <ng-icon name="bootstrapBell" />
            {{ 'general.notificationMethods' | transloco }}
          </a>
        </li>
        <li hlmSidebarMenuItem>
          <a
            #spRla="routerLinkActive"
            [isActive]="spRla.isActive"
            hlmSidebarMenuButton
            routerLink="/t/{{ selectedTeamId() }}/status-pages"
            routerLinkActive>
            <ng-icon name="bootstrapChatLeftQuote" />
            {{ 'general.statusPages' | transloco }}
          </a>
        </li>
        <li hlmSidebarMenuItem>
          <a
            #mntRla="routerLinkActive"
            [isActive]="mntRla.isActive"
            hlmSidebarMenuButton
            routerLink="/t/{{ selectedTeamId() }}/maintenance"
            routerLinkActive>
            <ng-icon name="lucideCalendarClock" />
            Maintenance
          </a>
        </li>
        <ng-container *isTeamAdmin>
          <li hlmSidebarMenuItem>
            <a
              #rbRla="routerLinkActive"
              [isActive]="rbRla.isActive"
              hlmSidebarMenuButton
              routerLink="/t/{{ selectedTeamId() }}/recycle-bin"
              routerLinkActive>
              <ng-icon name="bootstrapTrash3" />
              {{ 'general.recycleBin' | transloco }}
            </a>
          </li>
          <li hlmSidebarMenuItem>
            <a
              #tsRla="routerLinkActive"
              [isActive]="tsRla.isActive"
              hlmSidebarMenuButton
              routerLink="/t/{{ selectedTeamId() }}/edit"
              routerLinkActive>
              <ng-icon name="bootstrapGearWide" />
              {{ 'general.settings' | transloco }}
            </a>
          </li>
        </ng-container>
      </ul>
    </hlm-sidebar-group>
  `,
  selector: 'nav-project-detail',
  imports: [HlmSidebarImports, NgIcon, RouterLink, RouterLinkActive, TranslocoPipe, IsTeamAdmin],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavProjectDetail {
  protected readonly selectedTeamStore = inject(SelectedTeamStore);

  public readonly selectedTeam = input.required<BackendType['TeamMaxResponse']>();
  selectedTeamId = computed(() => this.selectedTeam()?.id ?? 'selectedTeamId');
}

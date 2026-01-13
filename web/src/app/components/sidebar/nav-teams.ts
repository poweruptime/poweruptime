import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmSidebarImports, HlmSidebarService} from '@spartan-ng/helm/sidebar';

import {SelectedTeamStore} from '@app/services';

@Component({
  template: `
    @let teams = selectedTeamStore.onceSelectedTeamsCut();
    @if (teams.length > 0) {
      <hlm-sidebar-group>
        <div hlmSidebarGroupLabel>{{ 'general.teams' | transloco }}</div>
        <ul hlmSidebarMenu>
          @for (team of teams; track team.id) {
            <li hlmSidebarMenuItem>
              <a
                #rla="routerLinkActive"
                [isActive]="rla.isActive"
                routerLink="/t/{{ team.id }}/{{ sidebarService.isMobile() ? 'mm' : 'm' }}"
                routerLinkActive
                hlmSidebarMenuButton>
                {{ team.name }}
              </a>
              <button
                [hlmDropdownMenuTrigger]="menu"
                [hlmDropdownMenuTriggerData]="{$implicit: {team}}"
                [side]="_menuSide()"
                [align]="_menuAlign()"
                type="button"
                hlmSidebarMenuAction
                showOnHover>
                <ng-icon name="lucideEllipsis" />
                <span class="sr-only">More</span>
              </button>
            </li>
          }
        </ul>
      </hlm-sidebar-group>
    }

    <ng-template #menu let-ctx>
      <hlm-dropdown-menu class="w-48">
        <hlm-dropdown-menu-group>
          <hlm-dropdown-menu-label>{{ ctx.team.name }}</hlm-dropdown-menu-label>
        </hlm-dropdown-menu-group>
        <hlm-dropdown-menu-separator />
        <button
          (click)="selectedTeamStore.removeSelectedTeam(ctx.team.id)"
          type="button"
          hlmDropdownMenuItem>
          <ng-icon name="lucidePinOff" />
          Unpin Team
        </button>
      </hlm-dropdown-menu>
    </ng-template>
  `,
  selector: 'nav-teams',
  imports: [
    HlmSidebarImports,
    NgIcon,
    RouterLink,
    HlmDropdownMenuImports,
    TranslocoPipe,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavTeams {
  protected readonly sidebarService = inject(HlmSidebarService);
  protected readonly selectedTeamStore = inject(SelectedTeamStore);

  protected readonly _menuSide = computed(() =>
    this.sidebarService.isMobile() ? 'bottom' : 'right',
  );
  protected readonly _menuAlign = computed(() =>
    this.sidebarService.isMobile() ? 'end' : 'start',
  );
}

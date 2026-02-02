import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmSidebarImports, HlmSidebarService} from '@spartan-ng/helm/sidebar';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

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
                <span class="max-w-48 truncate">
                  {{ team.name }}
                </span>
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
          <hlm-dropdown-menu-label class="flex items-center justify-between">
            <span>{{ ctx.team.name }}</span>
            <hlm-tooltip>
              <button
                (click)="selectedTeamStore.removeSelectedTeam(ctx.team.id)"
                hlmBtn
                hlmTooltipTrigger
                type="button"
                variant="ghost"
                size="icon-sm">
                <ng-icon name="lucidePinOff" />
              </button>
              <span *brnTooltipContent>Unpin Team</span>
            </hlm-tooltip>
          </hlm-dropdown-menu-label>
        </hlm-dropdown-menu-group>
        <hlm-dropdown-menu-separator />
        <a routerLink="/t/{{ ctx.team.id }}/notification-methods" hlmDropdownMenuItem>
          <ng-icon name="bootstrapBell" />
          {{ 'general.notificationMethods' | transloco }}
        </a>
        <a routerLink="/t/{{ ctx.team.id }}/status-pages" hlmDropdownMenuItem>
          <ng-icon name="bootstrapChatLeftQuote" />
          {{ 'general.statusPages' | transloco }}
        </a>
        <a routerLink="/t/{{ ctx.team.id }}/recycle-bin" hlmDropdownMenuItem>
          <ng-icon name="bootstrapTrash3" />
          {{ 'general.recycleBin' | transloco }}
        </a>
        <a routerLink="/t/{{ ctx.team.id }}/edit" hlmDropdownMenuItem>
          <ng-icon name="bootstrapGearWide" />
          {{ 'general.settings' | transloco }}
        </a>
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
    HlmButtonImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
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

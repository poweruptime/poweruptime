import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router, RouterLink, RouterLinkActive} from '@angular/router';

import {filter, map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmCollapsibleImports} from '@spartan-ng/helm/collapsible';
import {HlmDialogService} from '@spartan-ng/helm/dialog';
import {HlmSidebarImports} from '@spartan-ng/helm/sidebar';
import {createInjectable} from 'ngxtension/create-injectable';

import {IsSystemAdmin} from '@app/directives';

import {HelpDialog} from '../_dialog/help-dialog';

@Component({
  template: `
    <hlm-sidebar-group>
      <div hlmSidebarGroupContent>
        <ul hlmSidebarMenu>
          <li hlmSidebarMenuItem>
            <button (click)="openHelp()" type="button" hlmSidebarMenuButton size="sm">
              <ng-icon name="bootstrapQuestionCircle" />
              {{ 'general.help' | transloco }}
            </button>
          </li>
          <li hlmSidebarMenuItem>
            <a
              href="https://github.com/poweruptime/poweruptime/discussions/categories/feature-requests-ideas"
              target="_blank"
              rel="noopener"
              hlmSidebarMenuButton
              size="sm">
              <ng-icon name="lucideSend" />
              Feedback
            </a>
          </li>
          <hlm-collapsible
            *isSystemAdmin
            [expanded]="instanceSettingsExpanded()"
            (expandedChange)="instanceSettingsNavExpandedState.state.set($event)">
            <li hlmSidebarMenuItem>
              <a
                #isRla="routerLinkActive"
                [isActive]="isRla.isActive"
                [routerLinkActiveOptions]="{exact: true}"
                routerLinkActive
                routerLink="/settings/overview"
                hlmSidebarMenuButton>
                <ng-icon name="bootstrapBuildingGear" />
                {{ 'nav.instanceSettings' | transloco }}
              </a>
              <button
                class="data-[state=open]:rotate-90"
                type="button"
                hlmCollapsibleTrigger
                hlmSidebarMenuAction>
                <ng-icon name="lucideChevronRight" />
              </button>
              <hlm-collapsible-content>
                <ul hlmSidebarMenuSub>
                  <li hlmSidebarMenuSubItem>
                    <a
                      #isURla="routerLinkActive"
                      [isActive]="isURla.isActive"
                      routerLinkActive
                      routerLink="/settings/users"
                      hlmSidebarMenuSubButton>
                      {{ 'general.users' | transloco }}
                    </a>
                    <a
                      #isTRla="routerLinkActive"
                      [isActive]="isTRla.isActive"
                      routerLink="/settings/teams"
                      routerLinkActive
                      hlmSidebarMenuSubButton>
                      {{ 'general.teams' | transloco }}
                    </a>
                    <a
                      #isIRla="routerLinkActive"
                      [isActive]="isIRla.isActive"
                      routerLink="/settings/info"
                      routerLinkActive
                      hlmSidebarMenuSubButton>
                      {{ 'instanceSettings.info' | transloco }}
                    </a>
                  </li>
                </ul>
              </hlm-collapsible-content>
            </li>
          </hlm-collapsible>
        </ul>
      </div>
    </hlm-sidebar-group>
  `,
  selector: 'nav-secondary',
  imports: [
    HlmSidebarImports,
    NgIcon,
    TranslocoPipe,
    RouterLink,
    IsSystemAdmin,
    RouterLinkActive,
    HlmCollapsibleImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavSecondary {
  private readonly dialog = inject(HlmDialogService);

  protected readonly instanceSettingsNavExpandedState = inject(instanceSettingsExpandedState);

  private router = inject(Router);
  private hasActiveChild = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      map((url) => instanceSettingRoutes.some((route) => url.includes(route))),
    ),
    {initialValue: false},
  );

  protected instanceSettingsExpanded = computed(
    () => this.instanceSettingsNavExpandedState.state() ?? this.hasActiveChild(),
  );

  protected openHelp() {
    this.dialog.open(HelpDialog, {
      showCloseButton: false,
    });
  }
}

const instanceSettingRoutes = [
  '/settings/users',
  '/settings/teams',
  '/settings/info',
  '/settings/overview',
];

const instanceSettingsExpandedState = createInjectable(() => {
  return {state: signal<boolean | undefined>(undefined)};
});

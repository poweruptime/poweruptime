import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {Router} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmAvatarImports} from '@spartan-ng/helm/avatar';
import {HlmSidebarImports} from '@spartan-ng/helm/sidebar';

import {TeamSelect} from '@app/components/team-select';
import {Pattern} from '@app/directives';
import {SelectedTeamStore} from '@app/services';

import {BackendImagePipe} from '../../pipes';
import {NavMain} from './nav-main';
import {NavProjectDetail} from './nav-project-detail';
import {NavSecondary} from './nav-secondary';
import {NavTeams} from './nav-teams';
import {NavUser} from './nav-user';

@Component({
  template: `
    <div hlmSidebarWrapper>
      <hlm-sidebar variant="inset">
        <hlm-sidebar-header>
          <ul hlmSidebarMenu>
            <li hlmSidebarMenuItem>
              @let _teamId = teamId();
              @let selectedTeam = selectedTeamStore.selectedTeam();
              <pu-team-select [teamId]="_teamId" (teamIdChange)="navigateToTeamDashboard($event)">
                <button type="button" hlmSidebarMenuButton size="lg">
                  <hlm-avatar class="rounded-lg after:rounded-lg">
                    @if (selectedTeam; as selectedTeam) {
                      @if (selectedTeam.image?.fileId; as imageId) {
                        <img
                          class="rounded-lg"
                          [ngSrc]="imageId | backendImage"
                          [alt]="selectedTeam.name + ' logo'"
                          priority
                          hlmAvatarImage
                          width="32"
                          height="32" />
                      }
                    }
                    <span hlmAvatarFallback>
                      @if (_teamId; as _teamId) {
                        <div class="aspect-square size-8 rounded-lg" [pu-pattern]="_teamId"></div>
                      } @else {
                        <img
                          class="size-8 rounded-lg"
                          priority
                          ngSrc="/assets/logo.webp"
                          alt="logo"
                          width="48"
                          height="48" />
                      }
                    </span>
                  </hlm-avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    @if (_teamId) {
                      @if (selectedTeamStore.selectedTeam(); as selectedTeam) {
                        <span class="truncate font-medium">{{ selectedTeam.name }}</span>
                      } @else {
                        <span class="truncate text-xs">{{ 'general.loading' | transloco }}</span>
                      }
                    } @else {
                      <span class="truncate font-medium">
                        {{ 'nav.teamSelect.select' | transloco }}
                      </span>
                    }
                  </div>

                  <ng-icon class="ml-auto text-base" name="bootstrapChevronExpand" />
                </button>
              </pu-team-select>
            </li>
          </ul>
        </hlm-sidebar-header>

        <hlm-sidebar-content>
          <nav-main />
          <nav-teams />
          @if (selectedTeamStore.selectedTeam(); as selectedTeam) {
            <nav-project-detail [selectedTeam]="selectedTeam" />
          }
          <nav-secondary class="mt-auto" />
        </hlm-sidebar-content>
        <hlm-sidebar-footer>
          <pu-nav-user />
        </hlm-sidebar-footer>
      </hlm-sidebar>
      <ng-content />
    </div>
  `,
  selector: 'pu-sidebar',
  imports: [
    HlmSidebarImports,
    NgIcon,
    NavProjectDetail,
    NavTeams,
    NavUser,
    NavSecondary,
    NavMain,
    TeamSelect,
    TranslocoPipe,
    NgOptimizedImage,
    Pattern,
    HlmAvatarImports,
    BackendImagePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly router = inject(Router);
  protected readonly selectedTeamStore = inject(SelectedTeamStore);

  teamId = input<string>();

  navigateToTeamDashboard(newTeamId: string | undefined) {
    if (!newTeamId) {
      return;
    }
    const current = this.router.url; // e.g. "/t/abc/notification-methods"
    if (teamSegmentRe.test(current)) {
      // replace "t/{oldId}" with "t/{newTeamId}"
      const updated = current.replace(teamSegmentRe, `t/${newTeamId}`);
      void this.router.navigateByUrl(updated);
    } else {
      // no match → go directly to "/t/{newTeamId}"
      void this.router.navigate(['/', 't', newTeamId], {
        queryParamsHandling: 'preserve',
        preserveFragment: true,
      });
    }
  }
}

const teamSegmentRe = /t\/[^/;?]+/;

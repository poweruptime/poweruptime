import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {MatListItem, MatNavList} from '@angular/material/list';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {BiComponent, provideBi, withSize} from 'dfx-bootstrap-icons';

import {NavTeamSelect} from '@app/components/nav-team-select';
import {IsSystemAdmin} from '@app/directives';
import {SelectedTeamStore} from '@app/services';

@Component({
  template: `
    <div class="flex h-full flex-col">
      <div class="flex flex-col gap-3 px-2 py-2">
        <pu-nav-team-select [teamId]="teamId()" />
        <mat-nav-list>
          <a mat-list-item routerLink="/m" routerLinkActive="active">
            <bi name="lightning" />
            <span class="nav-text">Personal Dashboard</span>
          </a>

          <a
            [routerLinkActiveOptions]="{exact: true}"
            mat-list-item
            routerLink="/t"
            routerLinkActive="active">
            <bi name="people" />
            <span class="nav-text">Teams</span>
          </a>

          <div class="mb-2 mt-4 flex items-center gap-3">
            <hr class="border-reef-gray-200 dark:border-reef-gray-500 w-10" />
            <span class="whitespace-nowrap break-keep">
              @if (selectedTeamStore.selectedTeam(); as selectedTeam) {
                {{ selectedTeam.name }}
              } @else {
                Team
              }
            </span>
            <hr class="border-reef-gray-200 dark:border-reef-gray-500 w-full" />
          </div>

          <a mat-list-item routerLink="/t/{{ selectedTeamId() }}/m" routerLinkActive="active">
            <bi name="speedometer2" />
            <span class="nav-text">Dashboard</span>
          </a>
          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/notification-methods"
            routerLinkActive="active">
            <bi name="bell" />
            <span class="nav-text">Notification methods</span>
          </a>
          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/status-pages"
            routerLinkActive="active">
            <bi name="chat-left-quote" />
            <span class="nav-text">Status Pages</span>
          </a>
          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/recycle-bin"
            routerLinkActive="active">
            <bi name="trash3" />
            <span class="nav-text">Recycle Bin</span>
          </a>
          <a mat-list-item routerLink="/t/{{ selectedTeamId() }}/edit" routerLinkActive="active">
            <bi name="gear-wide" />
            <span class="nav-text">Settings</span>
          </a>
        </mat-nav-list>
      </div>
      <div class="mt-auto px-2 pt-2">
        <hr class="border-reef-gray-200 dark:border-reef-gray-500" />
        <mat-nav-list *isSystemAdmin>
          <a mat-list-item routerLink="/settings" routerLinkActive="active">
            <bi name="building-gear" />
            <span class="nav-text">Instance settings</span>
          </a>
        </mat-nav-list>
      </div>
    </div>
  `,
  styles: `
    .active {
      @apply bg-neutral-100 dark:bg-neutral-800;

      .nav-text {
        @apply font-semibold;
      }
    }
  `,
  selector: 'pu-nav',
  providers: [provideBi(withSize('20'))],
  imports: [
    MatListItem,
    RouterLink,
    RouterLinkActive,
    MatNavList,
    NavTeamSelect,
    IsSystemAdmin,
    BiComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nav {
  readonly selectedTeamStore = inject(SelectedTeamStore);

  selectedTeamId = computed(() => this.selectedTeamStore.selectedTeamId() ?? 'selectedTeamId');

  teamId = input<string>();
}

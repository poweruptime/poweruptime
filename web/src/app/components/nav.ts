import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {MatButton, MatIconAnchor} from '@angular/material/button';
import {MatDivider} from '@angular/material/divider';
import {MatListItem, MatNavList} from '@angular/material/list';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {BiComponent} from 'dfx-bootstrap-icons';

import {NavTeamSelect} from '@app/components/nav-team-select';
import {IsSystemAdmin} from '@app/directives';
import {AuthStore, ProfileStore, SelectedTeamStore} from '@app/services';

@Component({
  template: `
    <div class="flex h-full flex-col">
      <div class="flex flex-col gap-3 px-2 py-2">
        <pu-nav-team-select [teamId]="teamId()" />
        <mat-nav-list>
          <a
            class="mb-4"
            [routerLinkActiveOptions]="{exact: true}"
            mat-list-item
            routerLink="/t"
            routerLinkActive="active">
            Teams
          </a>

          <mat-divider class="py-2" />

          @if (selectedTeamStore.selectedTeamId()) {
            <a mat-list-item routerLink="/t/{{ selectedTeamId() }}/m" routerLinkActive="active">
              Dashboard
            </a>
          } @else {
            <a mat-list-item routerLink="/m" routerLinkActive="active">Dashboard</a>
          }
          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/notification-methods"
            routerLinkActive="active">
            Notification methods
          </a>
          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/status-pages"
            routerLinkActive="active">
            Status Pages
          </a>
          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/recycle-bin"
            routerLinkActive="active">
            Recycle Bin
          </a>
          <a mat-list-item routerLink="/t/{{ selectedTeamId() }}/edit" routerLinkActive="active">
            Settings
          </a>
        </mat-nav-list>
      </div>
      <div class="mt-auto flex flex-col gap-3 px-2 pt-2">
        <hr class="border-reef-gray-200 dark:border-reef-gray-500" />
        <mat-nav-list *isSystemAdmin>
          <a mat-list-item routerLink="/settings" routerLinkActive="active">Instance settings</a>
        </mat-nav-list>

        <div class="flex items-center justify-between pb-4">
          <button (click)="authStore.logout()" mat-flat-button>Logout</button>
          <div class="inline-flex items-center gap-2">
            <span>Hallo {{ profileStore.name() }}</span>
            <a mat-icon-button routerLink="/profile">
              <bi name="gear" />
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .active {
      @apply bg-neutral-100 dark:bg-neutral-800;
    }
  `,
  selector: 'pu-nav',
  imports: [
    MatButton,
    MatListItem,
    RouterLink,
    RouterLinkActive,
    MatNavList,
    MatDivider,
    NavTeamSelect,
    IsSystemAdmin,
    MatIconAnchor,
    BiComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nav {
  readonly authStore = inject(AuthStore);
  readonly profileStore = inject(ProfileStore);
  readonly selectedTeamStore = inject(SelectedTeamStore);

  selectedTeamId = computed(() => this.selectedTeamStore.selectedTeamId() ?? 'selectedTeamId');

  teamId = input<string>();
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {InitialsPipe} from '@spartan-ng/brain/avatar';
import {HlmAvatarImports} from '@spartan-ng/helm/avatar';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmCheckboxImports} from '@spartan-ng/helm/checkbox';
import {HlmDataTableImports} from '@spartan-ng/helm/data-table';
import {HlmDialogService} from '@spartan-ng/helm/dialog';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmPaginator, HlmPaginatorImports} from '@spartan-ng/helm/paginator';
import {HlmSort, HlmSortImports} from '@spartan-ng/helm/sort';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {TeamUsersStore} from '@app/services';

import {TeamInviteDialog} from '../_dialog/team-invite-dialog';

@Component({
  template: `
    @let _teamId = teamId();

    <section class="flex flex-col gap-6" hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>{{ 'general.users' | transloco }}</h3>
      </div>
      <div class="grid gap-2" hlmCardContent>
        <div class="flex gap-2">
          <button (click)="openInviteDialog()" type="button" hlmBtn>
            <ng-icon hlm size="sm" name="lucideUserPlus" />
            {{ 'general.invite' | transloco }}
          </button>

          <button
            [disabled]="!teamUsersStore.hasValue()"
            (click)="teamUsersStore.removeSelection(_teamId)"
            type="button"
            variant="secondary"
            hlmBtn>
            <ng-icon hlm size="sm" name="bootstrapTrashFill" />
            Remove from team
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <div class="overflow-hidden">
            <div hlmTableContainer>
              <table
                [dataSource]="teamUsersStore.entities()"
                [hlmSortActive]="teamUsersStore.sortBy()"
                [hlmSortDirection]="teamUsersStore.sortDirection()"
                hlm-data-table
                hlmSort>
                <!-- Checkbox Column -->
                <ng-container hlmColumnDef="select">
                  <th *hlmHeaderCellDef hlm-header-cell>
                    <hlm-checkbox
                      [checked]="teamUsersStore.isAllSelected()"
                      [indeterminate]="teamUsersStore.hasValue() && !teamUsersStore.isAllSelected()"
                      (checkedChange)="teamUsersStore.toggleAll()" />
                  </th>
                  <td *hlmCellDef="let row" hlm-cell>
                    <hlm-checkbox
                      [checked]="teamUsersStore.isSelected(row)"
                      (checkedChange)="teamUsersStore.toggle(row)"
                      stopPropagation />
                  </td>
                </ng-container>

                <ng-container hlmColumnDef="id.user.name">
                  <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                    {{ 'general.name' | transloco }}
                  </th>
                  <td *hlmCellDef="let element" hlm-cell>
                    <div class="flex items-center gap-1.5">
                      <hlm-avatar class="rounded-lg">
                        <span class="bg-muted text-muted-foreground rounded-lg" hlmAvatarFallback>
                          {{ element.user.name | initials }}
                        </span>
                      </hlm-avatar>
                      <div class="inline-flex flex-col gap-1">
                        <div class="inline-flex items-center gap-2">
                          <span>{{ element.user.name }}</span>
                          @if (element.role === 'ADMIN') {
                            <span
                              class="bg-primary text-primary-foreground"
                              hlmBadge
                              variant="secondary">
                              <ng-icon name="bootstrapStarFill" />
                              Admin
                            </span>
                          }
                        </div>
                        <span class="text-gray-600 dark:text-gray-500">
                          {{ element.user.email }}
                        </span>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <ng-container hlmColumnDef="invitedBy.name">
                  <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                    {{ 'team.settings.invitedBy' | transloco }}
                  </th>
                  <td *hlmCellDef="let element" hlm-cell>
                    @if (element.invitedBy; as invitedBy) {
                      {{ invitedBy.name }}
                    } @else {
                      <span
                        class="bg-blue-500 text-white dark:bg-blue-600"
                        hlmBadge
                        variant="secondary">
                        <ng-icon name="lucideBadgeCheck" />
                        System
                      </span>
                    }
                  </td>
                </ng-container>

                <ng-container hlmColumnDef="createdAt">
                  <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                    {{ 'team.settings.joinedAt' | transloco }}
                  </th>
                  <td *hlmCellDef="let element" hlm-cell>
                    <pu-relative-time [value]="element.invitedAt" format="yyyy.MM.dd HH:mm:ss" />
                  </td>
                </ng-container>

                <tr *hlmHeaderRowDef="teamUsersStore.columnsToDisplay()" hlm-header-row></tr>
                <tr *hlmRowDef="let row; columns: teamUsersStore.columnsToDisplay()" hlm-row></tr>
              </table>
            </div>
          </div>

          <pu-table-loading-bar [loading]="teamUsersStore.isPending()" />

          @if (teamUsersStore.isEmpty()) {
            <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
          }

          <hlm-paginator
            [pageSizeOptions]="[10, 20, 50, 100, 200]"
            [pageSize]="teamUsersStore.size()"
            [pageIndex]="teamUsersStore.page()"
            [length]="teamUsersStore.totalElements()"
            showFirstLastButtons />
        </div>
      </div>
    </section>
  `,
  styles: `
    @reference "#styles.css";

    .hlm-column-role {
      @apply w-32;
    }

    .hlm-column-id-user-name {
      @apply w-64;
    }

    .hlm-column-invitedBy-name {
      @apply w-64;
    }
  `,
  selector: 'pu-team-user-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StopPropagationDirective,
    TableLoadingBar,
    RelativeTimeWithTooltip,
    TranslocoPipe,
    InitialsPipe,
    HlmTableContainer,
    HlmPaginatorImports,
    HlmDataTableImports,
    HlmSortImports,
    HlmAvatarImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmIconImports,
    HlmCardImports,
    HlmCheckboxImports,
  ],
})
export class TeamUserTable {
  protected readonly teamUsersStore = inject(TeamUsersStore);
  private readonly dialog = inject(HlmDialogService);

  readonly teamId = input.required<string>();

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.teamUsersStore.setHlmPaginator(this.paginator);
    this.teamUsersStore.setHlmSort(this.sort);

    this.teamUsersStore.load(
      computed(() => ({
        teamId: this.teamId(),
        ...this.teamUsersStore.pageable(),
      })),
    );
  }

  openInviteDialog() {
    this.dialog.open(TeamInviteDialog, {
      context: {
        teamId: this.teamId(),
      },
    });
  }
}

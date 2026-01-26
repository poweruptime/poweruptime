import {ChangeDetectionStrategy, Component, inject, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';

import {HlmPaginator, HlmPaginatorImports} from '@dafnik/paginator';
import {HlmSort, HlmSortImports} from '@dafnik/sort';
import {HlmDataTableImports} from '@dafnik/table';
import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {DfxImplodePipe, StopPropagationDirective} from 'dfx-helper';

import {IsTeamAdmin} from '@app/directives';
import {BooleanEmojiPipe, NotificationSenderDataValueLabelPipe} from '@app/pipes';
import {NotificationMethodsStore} from '@app/services';
import {trackBy} from '@app/util';

import {TableLoadingBar} from '../table-loading-bar';

@Component({
  template: `
    <div class="grid gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="notificationMethodsStore.entities()"
            [hlmSortActive]="notificationMethodsStore.sortBy()"
            [hlmSortDirection]="notificationMethodsStore.sortDirection()"
            [trackBy]="trackBy"
            hlm-data-table
            hlmSort>
            <ng-container hlmColumnDef="name">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.name' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>{{ element.name }}</td>
            </ng-container>

            <ng-container hlmColumnDef="type">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.type' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                {{ element.type | notificationSenderDataValueLabel | transloco }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="sender">
              <th *hlmHeaderCellDef hlm-header-cell></th>
              <td *hlmCellDef="let element" hlm-cell>
                @switch (element.data._type) {
                  @case ('EMAIL') {
                    <div class="inline-flex items-center gap-1">
                      <span>{{ 'notificationMethod.list.email.recipient' | transloco }}</span>
                      <a
                        class="font-extrabold underline"
                        [href]="'mailto:' + $any(element.data)['to']"
                        stopPropagation
                        target="_blank"
                        rel="noopener noreferrer">
                        {{ $any(element.data)['to'] | s_implode: ', ' : 40 : '...' }}
                      </a>
                      <span>{{ 'notificationMethod.list.email.via' | transloco }}</span>
                      <a
                        class="font-extrabold underline"
                        [href]="'https://' + $any(element.data)['host']"
                        stopPropagation
                        target="_blank"
                        rel="noopener noreferrer">
                        {{ $any(element.data)['host'] }}
                      </a>
                    </div>
                  }
                }
              </td>
            </ng-container>

            <ng-container hlmColumnDef="useByDefault">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'notificationMethod.edit.useByDefault' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>{{ element.useByDefault | booleanEmoji }}</td>
            </ng-container>

            <ng-container hlmColumnDef="actions">
              <th *hlmHeaderCellDef hlm-header-cell></th>
              <td *hlmCellDef="let element" hlm-cell>
                <button
                  *isTeamAdmin
                  [hlmDropdownMenuTrigger]="menu"
                  type="button"
                  hlmBtn
                  stopPropagation
                  variant="ghost">
                  <span class="sr-only">Open notification method menu</span>
                  <ng-icon hlm size="sm" name="bootstrapThreeDotsVertical" />
                </button>

                <ng-template #menu>
                  <hlm-dropdown-menu class="w-56">
                    <hlm-dropdown-menu-label>
                      {{ 'general.options' | transloco }}
                    </hlm-dropdown-menu-label>

                    <hlm-dropdown-menu-group>
                      <a [routerLink]="element.id" hlmDropdownMenuItem>
                        <ng-icon hlm size="sm" name="bootstrapPencilSquare" />
                        {{ 'general.edit' | transloco }}
                      </a>
                      <button
                        (click)="notificationMethodsStore.clone({id: element.id})"
                        type="button"
                        hlmDropdownMenuItem>
                        <ng-icon hlm size="sm" name="bootstrapCopy" />
                        {{ 'general.copy' | transloco }}
                      </button>
                      <button
                        (click)="notificationMethodsStore.delete(element.id)"
                        type="button"
                        hlmDropdownMenuItem>
                        <ng-icon hlm size="sm" name="bootstrapTrashFill" />
                        {{ 'general.delete' | transloco }}
                      </button>
                    </hlm-dropdown-menu-group>
                  </hlm-dropdown-menu>
                </ng-template>
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="notificationMethodsStore.columnsToDisplay()" hlm-header-row></tr>
            <tr
              class="hover:cursor-pointer"
              *hlmRowDef="let element; columns: notificationMethodsStore.columnsToDisplay()"
              [routerLink]="element.id"
              hlm-row></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="notificationMethodsStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="notificationMethodsStore.size()"
        [pageIndex]="notificationMethodsStore.page()"
        [length]="notificationMethodsStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  styles: `
    @reference "#styles.css";

    .hlm-column-name {
      @apply w-52 text-nowrap;
    }
    .hlm-column-type {
      @apply w-20;
    }
    .hlm-column-useByDefault {
      @apply w-36;
    }
  `,
  selector: 'pu-notification-method-table',
  imports: [
    RouterLink,
    StopPropagationDirective,
    DfxImplodePipe,
    TranslocoPipe,
    IsTeamAdmin,
    TableLoadingBar,
    BooleanEmojiPipe,
    NotificationSenderDataValueLabelPipe,
    HlmTableContainer,
    HlmDataTableImports,
    HlmSortImports,
    HlmPaginatorImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmIconImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodTable {
  readonly notificationMethodsStore = inject(NotificationMethodsStore);

  readonly paginator = viewChild.required(HlmPaginator);
  readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.notificationMethodsStore.setHlmPaginator(this.paginator);
    this.notificationMethodsStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = trackBy;
}

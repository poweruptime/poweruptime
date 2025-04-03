import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {MatAnchor, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {TeamsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <a mat-flat-button routerLink="/t/new">{{ 'cmdk.groups.team.create' | transloco }}</a>

    <div class="table-responsive">
      <table
        [dataSource]="teamsStore.entities()"
        [matSortActive]="teamsStore.sortBy()"
        [matSortDirection]="teamsStore.sortDirection()"
        [trackBy]="trackBy"
        mat-table
        matSort>
        <ng-container matColumnDef="name">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.name' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            {{ element.name }}
          </td>
        </ng-container>

        <ng-container matColumnDef="personalUser.id">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.personal' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            {{ element.personal ? '✅' : '❌' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="monitorCount">
          <th *matHeaderCellDef mat-header-cell>{{ 'general.monitors' | transloco }}</th>
          <td *matCellDef="let element" mat-cell>
            {{ element.dashboard.monitorCount }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th *matHeaderCellDef mat-header-cell></th>
          <td *matCellDef="let element" mat-cell>
            <a
              [routerLink]="'/t/' + element.id + '/edit'"
              mat-icon-button
              matTooltip="Edit"
              stopPropagation>
              <bi name="gear" />
            </a>
            @if (!element.personal) {
              <button
                (click)="teamsStore.delete(element.id)"
                mat-icon-button
                type="button"
                matTooltip="Delete"
                stopPropagation>
                <bi name="trash" />
              </button>
            }
          </td>
        </ng-container>

        <tr *matHeaderRowDef="teamsStore.columnsToDisplay()" mat-header-row></tr>
        <tr
          *matRowDef="let row; columns: teamsStore.columnsToDisplay()"
          [routerLink]="'/t/' + row.id + '/edit'"
          mat-row></tr>
      </table>
    </div>

    <pu-table-loading-bar [loading]="teamsStore.isPending()" />

    @if (teamsStore.isEmpty()) {
      <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="teamsStore.size()"
      [pageIndex]="teamsStore.page()"
      [length]="teamsStore.totalElements()"
      showFirstLastButtons />
  `,
  styles: `
    @reference "../../../../styles.css";

    .mat-column-name {
      @apply w-80;
    }
    .mat-column-personalUser-id {
      @apply w-32;
    }
  `,
  selector: 'pu-instance-settings-teams-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TeamsStore],
  imports: [
    BiComponent,
    MatTableModule,
    MatSortModule,
    MatPaginator,
    TableLoadingBar,
    MatIconButton,
    MatTooltip,
    MatAnchor,
    RouterLink,
    StopPropagationDirective,
    MatIconAnchor,
    TranslocoPipe,
  ],
})
export class InstanceSettingsTeamsPage {
  readonly teamsStore = inject(TeamsStore);

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.teamsStore.setPaginator(this.paginator);
    this.teamsStore.setSort(this.sort);

    this.teamsStore.load(
      computed(() => ({
        name: this.teamsStore.name(),
        ...this.teamsStore.pageable(),
      })),
    );
  }

  protected readonly trackBy = trackBy;
}

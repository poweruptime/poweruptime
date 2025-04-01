import {BreakpointObserver} from '@angular/cdk/layout';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatAnchor} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatProgressBar} from '@angular/material/progress-bar';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {a_chunk} from 'dfts-helper';

import {TeamCard} from '@app/components/team';
import {InstanceSettingsStore, SelectedTeamStore} from '@app/services';
import {TailwindBreakpoints} from '@app/services/util';

@Component({
  template: `
    <div class="flex items-center justify-between gap-4 px-4 py-2">
      @if (instanceSettingsStore.settings()?.isUserAllowedToCreateTeams) {
        <a class="w-48" mat-flat-button routerLink="new">
          {{ 'cmdk.groups.team.create' | transloco }}
        </a>
      }

      <mat-form-field class="w-full" subscriptSizing="dynamic">
        <mat-label>{{ 'cmdk.groups.team.search' | transloco }}</mat-label>
        <input [formControl]="searchControl" matInput />
      </mat-form-field>
    </div>
    <cdk-virtual-scroll-viewport
      (scrolledIndexChange)="triggerNextPage()"
      minBufferPx="1500"
      maxBufferPx="1500"
      itemSize="230">
      <div
        class="grid h-[250px] gap-4 px-4 pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        *cdkVirtualFor="let chunk of chunkedItems()">
        @for (team of chunk; track team.id) {
          <pu-team-card class="block h-[230px]" [team]="team" />
        }
      </div>

      @if (selectedTeamStore.isPending()) {
        <mat-progress-bar class="mb-4" mode="indeterminate" />
      }
    </cdk-virtual-scroll-viewport>
  `,
  selector: 'pu-teams-page',
  styles: `
    cdk-virtual-scroll-viewport {
      height: 90vh;
      overflow-x: hidden;

      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */

      &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Edge */
      }
    }
  `,
  providers: [SelectedTeamStore],
  imports: [
    TeamCard,
    RouterLink,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    MatProgressBar,
    MatAnchor,
    TranslocoPipe,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly instanceSettingsStore = inject(InstanceSettingsStore);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly viewport = viewChild.required(CdkVirtualScrollViewport);

  readonly searchControl = new FormControl<string>('');

  constructor() {
    this.instanceSettingsStore.load();

    this.selectedTeamStore.setSearch(this.searchControl.valueChanges);

    this.selectedTeamStore.loadAvailableTeams(
      computed(() => ({
        page: this.selectedTeamStore.page(),
        size: 60,
        search: this.selectedTeamStore.search(),
      })),
    );
  }

  readonly chunkSize = computed(() => {
    if (this.breakpointObserver.isMatched(TailwindBreakpoints.xs)) {
      return BreakpointValues.xs;
    } else if (this.breakpointObserver.isMatched(TailwindBreakpoints.sm)) {
      return BreakpointValues.small;
    } else if (this.breakpointObserver.isMatched(TailwindBreakpoints.md)) {
      return BreakpointValues.medium;
    } else {
      return BreakpointValues.large;
    }
  });

  readonly chunkedItems = computed(() =>
    a_chunk(this.selectedTeamStore.sortedEntities(), this.chunkSize()),
  );

  protected triggerNextPage() {
    if (
      //note: scrolled container size must be greater than 0, we have to scroll from the top and bottom must have an offset smaller than 50 to trigger
      this.viewport().measureRenderedContentSize() > 0 &&
      this.viewport().measureScrollOffset('top') !== 0 &&
      this.viewport().measureScrollOffset('bottom') < 800
    ) {
      this.selectedTeamStore.nextPage();
    }
  }
}

export const BreakpointValues = {
  xs: 1,
  small: 2,
  medium: 3,
  large: 4,
};

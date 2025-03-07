import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {MatProgressBar} from '@angular/material/progress-bar';
import {RouterLink} from '@angular/router';

import {a_chunk} from 'dfts-helper';

import {TeamCard} from '@app/components/team';
import {InstanceSettingsStore, SelectedTeamStore} from '@app/services';

@Component({
  template: `
    @if (instanceSettingsStore.settings()?.isUserAllowedToCreateTeams) {
      <div class="px-4 pb-2">
        <a mat-flat-button routerLink="new">New team</a>
      </div>
    }
    <cdk-virtual-scroll-viewport
      (scrolledIndexChange)="triggerNextPage()"
      minBufferPx="1500"
      maxBufferPx="1500"
      itemSize="230">
      <div
        class="grid h-[250px] grid-cols-5 gap-4 px-4 pt-4"
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly instanceSettingsStore = inject(InstanceSettingsStore);

  readonly viewport = viewChild.required(CdkVirtualScrollViewport);

  constructor() {
    this.instanceSettingsStore.load();
    this.selectedTeamStore.loadAvailableTeams(
      computed(() => ({
        page: this.selectedTeamStore.page(),
        size: 60,
        search: '',
      })),
    );
  }

  readonly chunkedItems = computed(() => a_chunk(this.selectedTeamStore.sortedEntities(), 5));

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

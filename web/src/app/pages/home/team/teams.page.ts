import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {BreakpointObserver} from '@angular/cdk/layout';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmProgressImports} from '@spartan-ng/helm/progress';
import {a_chunk} from 'dfts-helper';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {TeamCard} from '@app/components/team';
import {InfoStore, SelectedTeamStore} from '@app/services';
import {TailwindBreakpoints} from '@app/services/util';

@Component({
  template: `
    <div class="flex items-center gap-4 px-4 py-2">
      @if (infoStore.isUserAllowedToCreateTeams()) {
        <a class="w-48" hlmBtn routerLink="new">
          <ng-icon name="lucideCirclePlus" hlm size="sm" />
          {{ 'team.create.create' | transloco }}
        </a>
      }

      <div class="w-72" hlmInputGroup>
        <div hlmInputGroupAddon>
          <ng-icon hlm name="bootstrapSearch" size="sm" />
        </div>
        <input
          [(ngModel)]="nameFilter"
          [placeholder]="'general.search' | transloco"
          hlmInputGroupInput />
        @if ((nameFilter()?.length ?? 0) > 0) {
          <button (click)="nameFilter.set('')" hlmInputGroupButton type="button">
            <ng-icon hlm name="bootstrapXLg" size="sm" />
            <span class="sr-only">{{ 'general.clear' | transloco }}</span>
          </button>
        }
      </div>
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
        <hlm-progress>
          <hlm-progress-indicator />
        </hlm-progress>
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
    TranslocoPipe,
    FormsModule,
    HlmButtonImports,
    HlmIconImports,
    HlmInputGroupImports,
    HlmProgressImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly infoStore = inject(InfoStore);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly viewport = viewChild.required(CdkVirtualScrollViewport);

  nameFilter = linkedQueryParam('name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });

  constructor() {
    this.infoStore.loadIsUserAllowedToCreateTeams();

    this.selectedTeamStore.setName(this.nameFilter);

    this.selectedTeamStore.loadAvailableTeams(
      computed(() => ({
        page: this.selectedTeamStore.page(),
        name: this.selectedTeamStore.name(),
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

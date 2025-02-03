import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {MatProgressBar} from '@angular/material/progress-bar';

import {ItemDirective} from '@ngxpert/cmdk';

import {SelectedTeamStore} from '@app/services';

@Component({
  template: `
    @for (team of selectedTeamStore.entities(); track team.id) {
      <button [value]="team.name" [filtered]="true" (selected)="selected.emit(team.id)" cmdkItem>
        {{ team.name }}
      </button>
    }

    @if (selectedTeamStore.isPending()) {
      <mat-progress-bar mode="indeterminate" />
    } @else if (selectedTeamStore.ids().length === 0) {
      <div class="cmdk-empty">No results found.</div>
    }
  `,
  selector: 'pu-cmdk-team-list',
  providers: [SelectedTeamStore],
  imports: [ItemDirective, MatProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmdkTeamList {
  selectedTeamStore = inject(SelectedTeamStore);

  searchValue = input.required<string>();
  selected = output<string>();

  constructor() {
    this.selectedTeamStore.setSearch(this.searchValue);

    this.selectedTeamStore.loadAvailableTeams(
      computed(() => ({
        page: 0,
        size: 15,
        search: this.selectedTeamStore.search(),
      })),
    );
  }
}

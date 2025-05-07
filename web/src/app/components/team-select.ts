import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {outputFromObservable, takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';

import {distinctUntilChanged, filter} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {MtxPopover, MtxPopoverTrigger} from '@ng-matero/extensions/popover';

import {SelectedTeamStore, TeamsStore} from '@app/services';

@Component({
  template: `
    <div
      #popoverTrigger="mtxPopoverTrigger"
      [mtxPopoverTriggerFor]="popover"
      mtxPopoverTriggerOn="click">
      <ng-content />
    </div>

    <mtx-popover
      #popover="mtxPopover"
      [position]="['below', 'after']"
      [closeOnPanelClick]="false"
      [closeOnBackdropClick]="true"
      [hideArrow]="true">
      <div class="flex max-w-80 flex-col">
        <mat-form-field class="mat-select-search-input" subscriptSizing="dynamic">
          <mat-label>{{ 'cmdk.groups.team.search' | transloco }}</mat-label>
          <input [formControl]="searchControl" matInput />
        </mat-form-field>

        <mat-radio-group
          class="mt-3 flex flex-col gap-2"
          [formControl]="selectedTeamControl"
          aria-labelledby="example-radio-group-label">
          @if (teamsStore.personalTeam(); as personalTeam) {
            <h2 class="font-bold">{{ 'nav.teamSelect.personal' | transloco }}</h2>
            <mat-radio-button [value]="personalTeam.id" (click)="close()">
              {{ personalTeam.name }}
            </mat-radio-button>
          }

          @let entities = teamsStore.sortedEntitiesWithoutPersonal();
          @if (entities.length > 0) {
            <h2 class="font-bold">{{ 'general.teams' | transloco }}</h2>
            @for (team of entities; track team.id) {
              <mat-radio-button [value]="team.id" (click)="close()">
                {{ team.name }}
              </mat-radio-button>
            }
          }
        </mat-radio-group>

        @if (teamsStore.isEmpty()) {
          <span>{{ 'general.nothingFound' | transloco }}</span>
        }

        @if (teamsStore.isPending()) {
          <mat-progress-bar mode="indeterminate" />
        }
      </div>
    </mtx-popover>
  `,
  styles: `
    @reference "#styles.css";

    ::ng-deep .mtx-popover-panel {
      @apply rounded-md border bg-neutral-50 dark:border-none dark:bg-neutral-800;
    }
  `,
  providers: [TeamsStore],
  selector: 'pu-team-select',
  imports: [
    ReactiveFormsModule,
    MatRadioButton,
    MatLabel,
    MatFormField,
    MatRadioGroup,
    MtxPopover,
    MtxPopoverTrigger,
    MatInput,
    MatProgressBar,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSelect {
  readonly teamsStore = inject(TeamsStore);

  readonly trigger = viewChild(MtxPopoverTrigger);

  readonly teamId = input(undefined, {
    transform: (teamId: string | undefined) => {
      if (teamId) {
        this.selectedTeamControl.setValue(teamId, {emitEvent: false});
      }

      return teamId;
    },
  });

  readonly adminOnly = input(false, {transform: booleanAttribute});

  readonly selectedTeamControl = new FormControl<string>('');
  readonly searchControl = new FormControl<string>('');

  teamIdSelected = outputFromObservable(
    this.selectedTeamControl.valueChanges.pipe(
      takeUntilDestroyed(),
      filter((it): it is string => !!it),
      distinctUntilChanged(),
    ),
  );

  constructor() {
    this.teamsStore.setName(this.searchControl.valueChanges);
    this.teamsStore.setRole(computed(() => (this.adminOnly() ? 'ADMIN' : undefined)));

    this.teamsStore.load(
      computed(() => ({
        page: 0,
        size: 10,
        name: this.teamsStore.name(),
        role: this.teamsStore.role(),
        sort: ['personalUser.id,ASC', 'name,ASC,ignorecase'],
      })),
    );
  }

  close() {
    setTimeout(() => this.trigger()?.closePopover(), 10);
  }
}

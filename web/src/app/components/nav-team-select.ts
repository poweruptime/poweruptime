import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatDivider} from '@angular/material/divider';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {Router} from '@angular/router';

import {distinctUntilChanged, filter} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {MtxPopover, MtxPopoverTrigger} from '@ng-matero/extensions/popover';
import {BiComponent} from 'dfx-bootstrap-icons';

import {SelectedTeamStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col px-4">
      <button
        #popoverTrigger="mtxPopoverTrigger"
        [mtxPopoverTriggerFor]="popover"
        mat-stroked-button
        color="secondary"
        mtxPopoverTriggerOn="click">
        <span>
          @if (teamId()) {
            @if (selectedTeamStore.selectedTeam(); as selectedTeam) {
              {{ selectedTeam.name }}
            } @else {
              {{ 'general.loading' | transloco }}
            }
          } @else {
            {{ 'nav.teamSelect.select' | transloco }}
          }
        </span>
        <bi name="chevron-expand" />
      </button>

      <mtx-popover
        #popover="mtxPopover"
        [position]="['below', 'after']"
        [closeOnPanelClick]="false"
        [closeOnBackdropClick]="true"
        [hideArrow]="true">
        <div class="flex max-w-80 flex-col">
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>{{ 'cmdk.groups.team.search' | transloco }}</mat-label>
            <input [formControl]="searchControl" matInput />
          </mat-form-field>

          <mat-radio-group
            class="mt-3 flex flex-col gap-2"
            [formControl]="selectedTeamControl"
            aria-labelledby="example-radio-group-label">
            @if (selectedTeamStore.personalTeam(); as personalTeam) {
              <h2 class="font-bold">{{ 'nav.teamSelect.personal' | transloco }}</h2>
              <mat-radio-button [value]="personalTeam.id" (click)="close()">
                {{ personalTeam.name }}
              </mat-radio-button>
            }

            @let entities = selectedTeamStore.sortedEntitiesWithoutPersonal();
            @if (entities.length > 0) {
              <h2 class="font-bold">{{ 'general.teams' | transloco }}</h2>
              @for (team of entities; track team.id) {
                <mat-radio-button [value]="team.id" (click)="close()">
                  {{ team.name }}
                </mat-radio-button>
              }
            }
          </mat-radio-group>

          @if (selectedTeamStore.isFulfilled() && selectedTeamStore.entities().length === 0) {
            <span>{{ 'general.nothingFound' | transloco }}</span>
          }

          @if (selectedTeamStore.isPending()) {
            <mat-progress-bar mode="indeterminate" />
          }
        </div>
      </mtx-popover>
    </div>
  `,
  styles: `
    ::ng-deep .mtx-popover-panel {
      @apply rounded-md border bg-neutral-50 dark:border-none dark:bg-neutral-800 !important;
    }
  `,
  selector: 'pu-nav-team-select',
  imports: [
    ReactiveFormsModule,
    MatRadioButton,
    MatButton,
    MatLabel,
    MatFormField,
    MatRadioGroup,
    MtxPopover,
    MtxPopoverTrigger,
    BiComponent,
    MatInput,
    MatDivider,
    MatProgressBar,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavTeamSelect {
  readonly selectedTeamStore = inject(SelectedTeamStore);

  readonly trigger = viewChild(MtxPopoverTrigger);

  readonly teamId = input.required({
    transform: (teamId: string | undefined) => {
      if (teamId) {
        this.selectedTeamControl.setValue(teamId, {emitEvent: false});
      }

      return teamId;
    },
  });

  readonly selectedTeamControl = new FormControl<string>('');
  readonly searchControl = new FormControl<string>('');

  constructor() {
    this.selectedTeamStore.setSearch(this.searchControl.valueChanges);

    this.selectedTeamStore.loadAvailableTeams(
      computed(() => ({
        page: 0,
        size: 10,
        search: this.selectedTeamStore.search(),
      })),
    );

    const router = inject(Router);

    this.selectedTeamControl.valueChanges
      .pipe(
        takeUntilDestroyed(),
        filter((it): it is string => !!it),
        distinctUntilChanged(),
      )
      .subscribe((_teamId) => {
        void router.navigate(['/', 't', _teamId]);
      });
  }

  close() {
    setTimeout(() => this.trigger()?.closePopover(), 10);
  }
}

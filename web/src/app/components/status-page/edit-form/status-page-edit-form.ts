import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendType, Database} from '@app/api';
import {Editor} from '@app/components/editor';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {MonitorsSearchStore} from '@app/services';

import {StatusPageEditFormGroupMonitors} from './status-page-edit-form-group-monitors';

@Component({
  template: `
    <form class="pb-4" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex justify-between gap-12">
        <div class="flex flex-col gap-3">
          <div class="flex gap-2">
            <mat-form-field class="w-full">
              <mat-label>{{ 'general.name' | transloco }}</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>{{ 'Slug' | transloco }}</mat-label>
              <input matInput formControlName="slug" />
            </mat-form-field>
          </div>

          <pu-editor
            id="description"
            [control]="form.controls.description"
            [placeholder]="'Description...' | transloco" />

          <pu-editor
            id="footer"
            [control]="form.controls.footer"
            [placeholder]="'Footer...' | transloco" />
        </div>

        <div class="flex flex-col gap-2" style="min-width: 37rem">
          @let isCollapsed = collapsed();

          <div class="flex justify-between">
            <div>
              <button (click)="onGroupAdd()" type="button" mat-flat-button>Add group</button>
            </div>

            <button
              [matTooltip]="isCollapsed ? 'Show monitors in groups' : 'Hide monitors in groups'"
              (click)="collapsed.set(!isCollapsed)"
              type="button"
              mat-icon-button>
              @if (isCollapsed) {
                <bi name="arrows-expand" />
              } @else {
                <bi name="arrows-collapse" />
              }
            </button>
          </div>

          <div
            class="drag-list flex flex-col gap-2"
            (cdkDropListDropped)="onGroupDrop($event)"
            cdkDropList
            formArrayName="groups">
            @for (
              statusPageGroupControl of form.controls.groups.controls;
              track index;
              let index = $index
            ) {
              <mat-card [formGroup]="statusPageGroupControl" cdkDrag appearance="outlined">
                <div class="group-drag-placeholder" *cdkDragPlaceholder></div>
                <mat-card-content>
                  <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between text-xl">
                      <div class="inline-flex items-center gap-2">
                        <div class="min-w-6 hover:cursor-move" cdkDragHandle>
                          <bi name="grip-vertical" size="20" />
                        </div>

                        <mat-form-field subscriptSizing="dynamic">
                          <mat-label>{{ 'general.name' | transloco }}</mat-label>
                          <input matInput formControlName="name" />
                        </mat-form-field>
                      </div>

                      <button
                        (click)="form.controls.groups.removeAt(index)"
                        type="button"
                        mat-icon-button>
                        <bi name="trash-fill" />
                      </button>
                    </div>

                    <pu-editor
                      id="description"
                      [control]="statusPageGroupControl.controls.description"
                      [placeholder]="'Description...' | transloco" />

                    <pu-status-page-edit-form-group-monitors
                      [(allSelectedMonitors)]="allSelectedMonitors"
                      [(monitorSearch)]="monitorSearch"
                      [monitorSearchPending]="monitorsSearchStore.isPending()"
                      [searchableMonitors]="monitorsSearchStore.entities()"
                      [index]="index"
                      [length]="form.controls.groups.controls.length"
                      [style.display]="isCollapsed ? 'none' : 'block'"
                      formControlName="monitorIds" />
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      </div>

      <pu-save-button [valid]="isValid()" />
    </form>
  `,
  styles: `
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .drag-list.cdk-drop-list-dragging mat-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .group-drag-placeholder {
      @apply min-h-48 animate-pulse rounded-md bg-gray-800;
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `,
  selector: 'pu-status-page-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MonitorsSearchStore],
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatFormField,
    MatInput,
    MatLabel,
    MatButton,
    MatIconButton,
    MatCard,
    MatCardContent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    BiComponent,
    SaveButton,
    Editor,
    StatusPageEditFormGroupMonitors,
    CdkDragPlaceholder,
    MatTooltip,
  ],
})
export class StatusPageEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateStatusPageDto'],
  BackendType['UpdateStatusPageDto']
> {
  override form = this.fb.nonNullable.group({
    id: [undefined as string | undefined],
    teamId: [undefined as string | undefined, [Validators.required]],
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(Database.MIN_NAME_LENGTH),
        Validators.maxLength(Database.MAX_NAME_LENGTH),
      ],
    ],
    slug: [
      '',
      [
        Validators.required,
        Validators.pattern(Database.SLUG_REGEX),
        Validators.minLength(Database.MIN_SLUG_LENGTH),
        Validators.maxLength(Database.MAX_SLUG_LENGTH),
      ],
    ],
    description: [undefined as string | undefined],
    footer: [undefined as string | undefined],
    groups: this.fb.nonNullable.array(
      [].map(() =>
        this.fb.group({
          name: ['' as string, [Validators.maxLength(Database.MAX_NAME_LENGTH)]],
          description: ['' as string | undefined],
          monitorIds: [[] as string[]],
        }),
      ),
    ),
  });

  readonly monitorsSearchStore = inject(MonitorsSearchStore);
  readonly isValid = injectIsValid(this.form);

  statusPage = input(undefined, {
    transform: (statusPage: BackendType['StatusPageResponse'] | undefined) => {
      this.isCreating.set(!statusPage);
      if (!statusPage) {
        return undefined;
      }

      if (statusPage.deleted) {
        this.formDisabled = true;
      }

      this.form.patchValue(statusPage);

      this.form.controls.groups.clear();
      statusPage.groups.forEach((group) => {
        this.form.controls.groups.push(
          this.fb.group({
            name: [group.name, [Validators.maxLength(Database.MAX_NAME_LENGTH)]],
            description: [group.description],
            monitorIds: [group.monitors.map((it) => it.monitor.id)],
          }),
        );
      });

      return statusPage;
    },
  });

  selectedTeamId = input.required({
    transform: (it?: string) => {
      if (it) {
        this.lumber.log('selectedTeamId', 'set selected team', it);
        this.form.controls.teamId.setValue(it);
      }
      return it;
    },
  });

  allSelectedMonitors = linkedSignal(
    computed(
      () =>
        this.statusPage()
          ?.groups?.map((group) => group.monitors.map((it) => it.monitor))
          ?.reduce(
            (acc, monitors) => [...acc, ...monitors],
            [] as BackendType['MonitorMinResponse'][],
          ) ?? [],
    ),
  );

  collapsed = signal(false);
  monitorSearch = signal('');

  constructor() {
    super();

    this.monitorsSearchStore.disableSyncQueryParams();
    this.monitorsSearchStore.setSearch(this.monitorSearch);
    this.monitorsSearchStore.searchMonitorsByTeamId(
      computed(() => ({
        teamId: this.selectedTeamId(),
        page: 0,
        statuses: [
          'UP' as const,
          'DOWN' as const,
          'MAINTENANCE' as const,
          'PAUSED' as const,
          'PENDING' as const,
        ],
        search: this.monitorsSearchStore.search(),
      })),
    );
  }

  onGroupAdd() {
    this.form.controls.groups.push(
      this.fb.group({
        name: ['', [Validators.maxLength(Database.MAX_NAME_LENGTH)]],
        description: [undefined as string | undefined],
        monitorIds: [[] as string[]],
      }),
    );
  }

  onGroupDrop(event: CdkDragDrop<BackendType['StatusPageGroupResponse'][]>) {
    let items = this.form.controls.groups.controls;
    moveItemInArray(items, event.previousIndex, event.currentIndex);
  }
}

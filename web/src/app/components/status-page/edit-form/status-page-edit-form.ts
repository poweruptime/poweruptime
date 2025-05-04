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
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from '@angular/material/chips';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatTooltip} from '@angular/material/tooltip';

import {map, of} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendType, Database, injectAPI} from '@app/api';
import {AlertDirective, FileUpload} from '@app/components';
import {Editor} from '@app/components/editor';
import {
  AbstractModelEditFormComponent,
  SaveButton,
  arrayItemMaxLength,
  arrayItemMinLength,
  arrayItemPattern,
  injectIsValid,
} from '@app/form';
import {MonitorsSearchStore} from '@app/services';

import {StatusPageEditFormGroupMonitors} from './status-page-edit-form-group-monitors';

@Component({
  template: `
    <form
      class="grid gap-12 md:grid-cols-2 pb-4"
      id="form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()">
      <div>
        <div class="grid grid-cols-2 gap-6">
          <mat-form-field class="col-span-1">
            <mat-label>{{ 'general.name' | transloco }}</mat-label>
            <input matInput formControlName="name" />

            @let nameErrors = form.controls.name.errors;
            @if (nameErrors?.['required']) {
              <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
            }
            @if (nameErrors?.['minlength']; as minlength) {
              <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
            }
            @if (nameErrors?.['maxlength']; as maxlength) {
              <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="col-span-1">
            <mat-label>{{ 'general.slug' | transloco }}</mat-label>
            <input matInput formControlName="slug" />

            @let slugErrors = form.controls.slug.errors;
            @if (slugErrors?.['required']) {
              <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
            }
            @if (slugErrors?.['pattern']) {
              <mat-error>{{ 'form.validation.slug' | transloco }}</mat-error>
            }
            @if (slugErrors?.['minlength']; as minlength) {
              <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
            }
            @if (slugErrors?.['maxlength']; as maxlength) {
              <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
            }
            @if (slugErrors?.['slugInUse']) {
              <mat-error>
                {{ 'statusPage.edit.slugInUse' | transloco }}
              </mat-error>
            }
          </mat-form-field>

          <pu-file-upload
            class="col-span-2 2xl:col-span-1"
            [file]="statusPage()?.image"
            [label]="'statusPage.edit.image' | transloco"
            (fileId)="form.controls.imageId.setValue($event)" />

          <div class="col-span-2 2xl:col-span-1">
            <mat-form-field class="w-full">
              <mat-label>{{ 'general.domainNames' | transloco }}</mat-label>
              <mat-chip-grid
                #domainNamesGrid
                [attr.aria-label]="'statusPage.edit.domainNames.enter' | transloco"
                formControlName="domainNames">
                @for (domainName of form.controls.domainNames.getRawValue(); track domainName) {
                  <mat-chip-row (removed)="removeDomainName(form.controls.domainNames, domainName)">
                    {{ domainName }}
                    <button
                      [attr.aria-label]="
                        'statusPage.edit.domainNames.remove' | transloco: {domainName}
                      "
                      matChipRemove>
                      <bi name="x-circle" aria-hidden="true" />
                    </button>
                  </mat-chip-row>
                }
              </mat-chip-grid>
              <input
                [matChipInputFor]="domainNamesGrid"
                [placeholder]="'statusPage.edit.domainNames.new' | transloco"
                (matChipInputTokenEnd)="addDomainName(form.controls.domainNames, $event)" />

              @let domainNameErrors = form.controls.domainNames.errors;
              @if (domainNameErrors?.['minLengthArrayItem']; as minlength) {
                <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
              }
              @if (domainNameErrors?.['maxLengthArrayItem']; as maxlength) {
                <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
              }
              @if (domainNameErrors?.['patternArrayItem']) {
                <mat-error>{{ 'form.validation.domain' | transloco }}</mat-error>
              }
              @if (domainNameErrors?.['domainNameInUse']; as domainNameInUse) {
                <mat-error>
                  {{ 'statusPage.edit.domainNames.inUse' | transloco: domainNameInUse }}
                </mat-error>
              }
            </mat-form-field>
          </div>

          <pu-editor
            class="col-span-2"
            id="description"
            [control]="form.controls.description"
            [placeholder]="('general.description' | transloco) + '...'" />

          <pu-editor
            class="col-span-2"
            id="footer"
            [control]="form.controls.footer"
            [placeholder]="('general.footer' | transloco) + '...'" />

          <pu-save-button class="ms-3" [valid]="isValid()" />
        </div>
      </div>

      <div class="flex flex-col gap-4">
        @let isCollapsed = collapsed();

        <div class="flex justify-between">
          <div>
            <button (click)="onGroupAdd()" type="button" mat-flat-button>
              {{ 'statusPage.edit.group.add' | transloco }}
            </button>
          </div>

          <button
            [matTooltip]="
              isCollapsed
                ? ('statusPage.edit.monitors.show' | transloco)
                : ('statusPage.edit.monitors.hide' | transloco)
            "
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

        @let groupsErrors = form.controls.groups.errors;
        @if (groupsErrors?.['required']) {
          <div puAlert type="INFO">{{ 'statusPage.edit.group.minOne' | transloco }}</div>
        }

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

                        @let groupNameErrors = statusPageGroupControl.controls.name.errors;
                        @if (groupNameErrors?.['maxlength']; as maxlength) {
                          <mat-error>
                            {{ 'form.validation.maxlength' | transloco: maxlength }}
                          </mat-error>
                        }
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
                    [placeholder]="('general.description' | transloco) + '...'" />

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
    </form>
  `,
  styles: `
    @reference "#styles.css";

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .drag-list.cdk-drop-list-dragging mat-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .group-drag-placeholder {
      @apply min-h-48 animate-pulse rounded-2xl bg-slate-400 dark:bg-gray-700;
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
    MatError,
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
    FileUpload,
    AlertDirective,
    MatChipGrid,
    MatChipRow,
    MatChipInput,
    MatChipRemove,
  ],
})
export class StatusPageEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateStatusPageDto'],
  BackendType['UpdateStatusPageDto']
> {
  private readonly api = injectAPI();
  readonly monitorsSearchStore = inject(MonitorsSearchStore);

  readonly oldDomainNames = signal<string[]>([]);

  statusPage = input(undefined, {
    transform: (statusPage: BackendType['StatusPageResponse'] | undefined) => {
      this.isCreating.set(!statusPage);
      if (!statusPage) {
        return undefined;
      }

      if (statusPage.deleted) {
        this.formDisabled = true;
      }

      this.oldDomainNames.set(statusPage.domainNames.slice());

      this.form.patchValue({
        ...statusPage,
        imageId: statusPage.image?.fileId,
      });

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
    slug: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(Database.MIN_SLUG_LENGTH),
        Validators.maxLength(Database.MAX_SLUG_LENGTH),
        Validators.pattern(Database.SLUG_REGEX),
      ],
      asyncValidators: [this.asyncSlugInUseValidator()],
      updateOn: 'blur',
    }),
    description: [undefined as string | undefined],
    footer: [undefined as string | undefined],
    imageId: [null as string | null],
    groups: this.fb.nonNullable.array(
      [].map(() =>
        this.fb.group({
          name: ['' as string, [Validators.maxLength(Database.MAX_NAME_LENGTH)]],
          description: ['' as string | undefined],
          monitorIds: [[] as string[]],
        }),
      ),
      [Validators.required],
    ),
    domainNames: new FormControl<string[]>([], {
      validators: [
        arrayItemMinLength(Database.MIN_DOMAIN_LENGTH),
        arrayItemMaxLength(Database.MAX_DOMAIN_LENGTH),
        arrayItemPattern(Database.DOMAIN_REGEX),
      ],
      asyncValidators: [this.asyncDomainNameUseValidator()],
      updateOn: 'blur',
    }),
  });
  readonly isValid = injectIsValid(this.form);

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

    this.monitorsSearchStore.setSearch(this.monitorSearch);
    this.monitorsSearchStore.load(
      computed(() => ({
        ...this.monitorsSearchStore.pageable(),
        teamId: this.selectedTeamId(),
        statuses: [
          'UP' as const,
          'DOWN' as const,
          'MAINTENANCE' as const,
          'PAUSED' as const,
          'PENDING' as const,
        ],
        search: this.monitorsSearchStore.search(),
        types: this.monitorsSearchStore.types(),
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

  removeDomainName(control: FormControl<string[] | null>, keyword: string) {
    const values = control.value;

    if (!values) {
      return;
    }

    const index = values.indexOf(keyword);
    if (index < 0) {
      return;
    }

    values.splice(index, 1);
    control.setValue([...values]);
  }

  addDomainName(control: FormControl<string[] | null>, event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      control.setValue([...(control.value ?? []), value]);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  private asyncSlugInUseValidator(): AsyncValidatorFn {
    return (control: AbstractControl) =>
      control.value === this.statusPage()?.slug
        ? of(null)
        : this.api
            .get('/v1/status-page/free/slug/{slug}', {params: {path: {slug: control.value}}})
            .pipe(
              map((free) => free.it),
              map((free) =>
                free ? null : ({slugInUse: 'slug already in use'} as ValidationErrors),
              ),
            );
  }

  private asyncDomainNameUseValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const usedDomainNames = this.oldDomainNames();
      const value: string[] | null = control.value;
      console.log('asyncDomainNameUseValidator', usedDomainNames, value);

      if (!value || value.length === 0) {
        return of(null);
      }

      const domainNamesList = value.filter((it) => !usedDomainNames.includes(it));
      const domainNames = domainNamesList.join(',');

      if (domainNames.length === 0) {
        return of(null);
      }

      console.log('domainNames to check', domainNames);

      return this.api
        .get('/v1/status-page/free/domain/{domainNames}', {
          params: {path: {domainNames}},
        })
        .pipe(
          map((response) => {
            const alreadyUsedDomainNames = response
              .map(({it}, index) => ({name: domainNamesList[index], free: it}))
              .filter((it) => !it.free);

            if (alreadyUsedDomainNames.length === 0) {
              return null;
            }

            return {
              domainNameInUse: {
                domainNames: alreadyUsedDomainNames.map((it) => it.name).join(', '),
              },
            } as ValidationErrors;
          }),
        );
    };
  }
}

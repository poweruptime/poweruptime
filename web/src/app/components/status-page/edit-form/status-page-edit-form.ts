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

import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from '@angular/material/chips';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import {map, of} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

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
      class="grid gap-12 pb-4 md:grid-cols-2"
      id="form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()">
      <div>
        <div class="grid grid-cols-2 gap-6">
          <hlm-form-field class="col-span-1">
            <label hlmLabel for="name">
              {{ 'general.name' | transloco }}
            </label>

            <div hlmInputGroup>
              <input id="name" hlmInputGroupInput formControlName="name" type="text" />
              <div hlmInputGroupAddon>
                <ng-icon name="lucideUser" />
              </div>
            </div>
            @let nameErrors = form.controls.name.errors;
            @if (nameErrors?.['required']) {
              <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
            }
            @if (nameErrors?.['minlength']; as minlength) {
              <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
            }
            @if (nameErrors?.['maxlength']; as maxlength) {
              <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
            }
          </hlm-form-field>

          <hlm-form-field class="col-span-1">
            <label hlmLabel for="slug">
              {{ 'general.slug' | transloco }}
            </label>

            <div hlmInputGroup>
              <div hlmInputGroupAddon>
                <label for="slug" hlmLabel>/</label>
              </div>
              <input id="slug" hlmInputGroupInput formControlName="slug" type="text" />
            </div>
            @let slugErrors = form.controls.slug.errors;
            @if (slugErrors?.['required']) {
              <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
            }
            @if (slugErrors?.['pattern']) {
              <hlm-error>{{ 'form.validation.slug' | transloco }}</hlm-error>
            }
            @if (slugErrors?.['minlength']; as minlength) {
              <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
            }
            @if (slugErrors?.['maxlength']; as maxlength) {
              <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
            }
            @if (slugErrors?.['slugInUse']) {
              <hlm-error>
                {{ 'statusPage.edit.slugInUse' | transloco }}
              </hlm-error>
            }
          </hlm-form-field>

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
                      type="button"
                      matChipRemove>
                      <ng-icon name="bootstrapXCircle" aria-hidden="true" />
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

          <div class="col-span-2">
            <pu-editor
              [placeholder]="('general.description' | transloco) + '...'"
              formControlName="description" />
          </div>

          <div class="col-span-2">
            <pu-editor
              [placeholder]="('general.footer' | transloco) + '...'"
              formControlName="footer" />
          </div>

          <pu-save-button class="ms-3" [valid]="isValid()" />
        </div>
      </div>

      <div class="flex flex-col gap-4">
        @let isCollapsed = collapsed();

        <div class="flex justify-between">
          <div>
            <button
              [disabled]="form.disabled"
              (click)="onGroupAdd()"
              hlmBtn
              variant="secondary"
              type="button">
              <ng-icon hlm size="sm" name="lucideCirclePlus" />
              {{ 'statusPage.edit.group.add' | transloco }}
            </button>
          </div>

          <hlm-tooltip>
            <button
              (click)="collapsed.set(!isCollapsed)"
              hlmBtn
              variant="ghost"
              size="icon-sm"
              type="button"
              hlmTooltipTrigger>
              @if (isCollapsed) {
                <ng-icon hlm size="sm" name="bootstrapArrowsExpand" />
              } @else {
                <ng-icon hlm size="sm" name="bootstrapArrowsCollapse" />
              }
            </button>
            <span *brnTooltipContent>
              @if (isCollapsed) {
                {{ 'statusPage.edit.monitors.show' | transloco }}
              } @else {
                {{ 'statusPage.edit.monitors.hide' | transloco }}
              }
            </span>
          </hlm-tooltip>
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
          @for (statusPageGroupControl of form.controls.groups.controls; track $index) {
            <section [formGroup]="statusPageGroupControl" hlmCard cdkDrag>
              <div class="group-drag-placeholder" *cdkDragPlaceholder></div>
              <div class="flex flex-col gap-4" hlmCardContent>
                <div class="flex items-center justify-between text-xl">
                  <div class="inline-flex items-center gap-2">
                    <div class="inline-flex min-w-6 items-center hover:cursor-move" cdkDragHandle>
                      <ng-icon hlm name="bootstrapGripVertical" />
                    </div>

                    <hlm-form-field>
                      <input
                        [id]="'group-name-' + $index"
                        [placeholder]="'general.name' | transloco"
                        hlmInput
                        formControlName="name"
                        type="text" />
                      @let groupNameErrors = statusPageGroupControl.controls.name.errors;
                      @if (groupNameErrors?.['maxlength']; as maxlength) {
                        <hlm-error>
                          {{ 'form.validation.maxlength' | transloco: maxlength }}
                        </hlm-error>
                      }
                    </hlm-form-field>
                  </div>

                  <hlm-tooltip>
                    <button
                      [disabled]="form.disabled"
                      (click)="form.controls.groups.removeAt($index)"
                      hlmBtn
                      hlmTooltipTrigger
                      variant="ghost"
                      size="icon-sm"
                      type="button">
                      <ng-icon hlm size="sm" name="bootstrapTrashFill" />
                    </button>
                    <span *brnTooltipContent>{{ 'general.delete' | transloco }}</span>
                  </hlm-tooltip>
                </div>

                <pu-editor
                  [placeholder]="('general.description' | transloco) + '...'"
                  formControlName="description" />

                @if (!isCollapsed) {
                  <pu-status-page-edit-form-group-monitors
                    [(allSelectedMonitors)]="allSelectedMonitors"
                    [(monitorSearch)]="monitorSearch"
                    [monitorSearchPending]="monitorsSearchStore.isPending()"
                    [searchableMonitors]="monitorsSearchStore.entities()"
                    [index]="$index"
                    [length]="form.controls.groups.controls.length"
                    animate.enter="animate-in fade-in slide-in-from-top-20 duration-300"
                    animate.leave="animate-out fade-out slide-out-to-top-20 duration-300"
                    formControlName="monitorIds" />
                }
              </div>
            </section>
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
    MatLabel,
    MatError,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    SaveButton,
    Editor,
    StatusPageEditFormGroupMonitors,
    CdkDragPlaceholder,
    FileUpload,
    AlertDirective,
    MatChipGrid,
    MatChipRow,
    MatChipInput,
    MatChipRemove,
    HlmCardImports,
    HlmTooltipImports,
    HlmButtonImports,
    BrnTooltipContentTemplate,
    HlmIconImports,
    HlmInputGroupImports,
    HlmFormFieldImports,
    HlmLabelImports,
    HlmInputImports,
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
            name: [group.name ?? null, [Validators.maxLength(Database.MAX_NAME_LENGTH)]],
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
        search: this.monitorSearch(),
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
    const items = this.form.controls.groups.controls;
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

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
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import {map, of} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmAlertImports} from '@spartan-ng/helm/alert';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {BackendType, Database, injectAPI} from '@app/api';
import {ProfilePictureUpload} from '@app/components';
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
import {chipInputAdd, chipInputRemove} from '@app/util';

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
          <div class="col-span-1 flex items-end gap-4">
            <pu-profile-picture-upload
              [file]="statusPage()?.image"
              [label]="'statusPage.edit.image' | transloco"
              (fileId)="form.controls.imageId.setValue($event)" />

            <hlm-field class="w-full">
              <label hlmFieldLabel for="name">
                {{ 'general.name' | transloco }}
              </label>

              <input
                id="name"
                hlmInput
                formControlName="name"
                type="text"
                placeholder="Status Page #1" />
              @let nameErrors = form.controls.name.errors;
              @if (nameErrors?.['required']) {
                <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
              }
              @if (nameErrors?.['minlength']; as minlength) {
                <hlm-field-error>
                  {{ 'form.validation.minlength' | transloco: minlength }}
                </hlm-field-error>
              }
              @if (nameErrors?.['maxlength']; as maxlength) {
                <hlm-field-error>
                  {{ 'form.validation.maxlength' | transloco: maxlength }}
                </hlm-field-error>
              }
            </hlm-field>
          </div>

          <hlm-field class="col-span-1 flex flex-col justify-end">
            <label hlmFieldLabel for="slug">
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
              <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
            }
            @if (slugErrors?.['pattern']) {
              <hlm-field-error>{{ 'form.validation.slug' | transloco }}</hlm-field-error>
            }
            @if (slugErrors?.['minlength']; as minlength) {
              <hlm-field-error>
                {{ 'form.validation.minlength' | transloco: minlength }}
              </hlm-field-error>
            }
            @if (slugErrors?.['maxlength']; as maxlength) {
              <hlm-field-error>
                {{ 'form.validation.maxlength' | transloco: maxlength }}
              </hlm-field-error>
            }
            @if (slugErrors?.['slugInUse']) {
              <hlm-field-error>
                {{ 'statusPage.edit.slugInUse' | transloco }}
              </hlm-field-error>
            }
          </hlm-field>

          <div class="col-span-2 grid gap-2 2xl:col-span-1">
            <div class="flex items-end gap-2">
              <form
                class="space-y-2"
                id="domainNameForm"
                [formGroup]="domainNameForm"
                (ngSubmit)="
                  chipInputAdd(form.controls.domainNames, domainNameForm.controls.domainName)
                ">
                <hlm-field>
                  <label for="domainName" hlmFieldLabel>
                    {{ 'general.domainNames' | transloco }}
                  </label>
                  <div hlmInputGroup>
                    <input
                      id="domainName"
                      [placeholder]="'statusPage.edit.domainNames.new' | transloco"
                      hlmInputGroupInput
                      formControlName="domainName"
                      type="text" />
                    <div hlmInputGroupAddon>
                      <ng-icon name="lucideServer" />
                    </div>
                  </div>
                </hlm-field>
              </form>
              <button
                [disabled]="
                  domainNameForm.invalid ||
                  (form.controls.domainNames.getRawValue() ?? '').includes(
                    domainNameForm.controls.domainName.getRawValue()
                  )
                "
                [hlmTooltip]="'statusPage.edit.domainNames.enter' | transloco"
                hlmBtn
                variant="outline"
                form="domainNameForm"
                type="submit">
                <ng-icon hlm name="lucideCirclePlus" size="sm" />
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              @for (domainName of form.controls.domainNames.getRawValue(); track $index) {
                <span hlmBadge variant="secondary">
                  <div class="flex items-center justify-center gap-1">
                    <span>{{ domainName }}</span>
                    <button
                      [attr.aria-label]="
                        'statusPage.edit.domainNames.remove' | transloco: {domainName}
                      "
                      (click)="chipInputRemove(form.controls.domainNames, domainName)"
                      hlmBtn
                      variant="ghost"
                      size="icon-xs"
                      type="button">
                      <ng-icon hlm name="lucideX" size="xs" />
                    </button>
                  </div>
                </span>
              }
            </div>
            @let domainNameErrors = form.controls.domainNames.errors;
            @if (domainNameErrors?.['minLengthArrayItem']; as minlength) {
              <hlm-field-error>
                {{ 'form.validation.minlength' | transloco: minlength }}
              </hlm-field-error>
            }
            @if (domainNameErrors?.['maxLengthArrayItem']; as maxlength) {
              <hlm-field-error>
                {{ 'form.validation.maxlength' | transloco: maxlength }}
              </hlm-field-error>
            }
            @if (domainNameErrors?.['patternArrayItem']) {
              <hlm-field-error>{{ 'form.validation.domain' | transloco }}</hlm-field-error>
            }
            @if (domainNameErrors?.['domainNameInUse']; as domainNameInUse) {
              <hlm-field-error>
                {{ 'statusPage.edit.domainNames.inUse' | transloco: domainNameInUse }}
              </hlm-field-error>
            }
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

          <button
            [hlmTooltip]="tooltip"
            (click)="collapsed.set(!isCollapsed)"
            hlmBtn
            variant="ghost"
            size="icon-sm"
            type="button">
            @if (isCollapsed) {
              <ng-icon hlm size="sm" name="bootstrapArrowsExpand" />
            } @else {
              <ng-icon hlm size="sm" name="bootstrapArrowsCollapse" />
            }
          </button>
          <ng-template #tooltip>
            <span>
              @if (isCollapsed) {
                {{ 'statusPage.edit.monitors.show' | transloco }}
              } @else {
                {{ 'statusPage.edit.monitors.hide' | transloco }}
              }
            </span>
          </ng-template>
        </div>

        @let groupsErrors = form.controls.groups.errors;
        @if (groupsErrors?.['required']) {
          <hlm-alert>
            <ng-icon name="lucideCircleAlert" />
            <h4 hlmAlertTitle>{{ 'statusPage.edit.group.minOne' | transloco }}</h4>
          </hlm-alert>
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

                    <hlm-field>
                      <input
                        [id]="'group-name-' + $index"
                        [placeholder]="'general.name' | transloco"
                        hlmInput
                        formControlName="name"
                        type="text" />
                      @let groupNameErrors = statusPageGroupControl.controls.name.errors;
                      @if (groupNameErrors?.['maxlength']; as maxlength) {
                        <hlm-field-error>
                          {{ 'form.validation.maxlength' | transloco: maxlength }}
                        </hlm-field-error>
                      }
                    </hlm-field>
                  </div>

                  <button
                    [disabled]="form.disabled"
                    [hlmTooltip]="'general.delete' | transloco"
                    (click)="form.controls.groups.removeAt($index)"
                    hlmBtn
                    variant="ghost"
                    size="icon-sm"
                    type="button">
                    <ng-icon hlm size="sm" name="bootstrapTrashFill" />
                  </button>
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
    StatusPageEditFormGroupMonitors,
    SaveButton,
    ProfilePictureUpload,
    Editor,
    ReactiveFormsModule,
    TranslocoPipe,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    HlmCardImports,
    HlmTooltipImports,
    HlmButtonImports,
    HlmIconImports,
    HlmInputGroupImports,
    HlmLabelImports,
    HlmInputImports,
    HlmAlertImports,
    HlmBadgeImports,
    HlmFieldImports,
  ],
})
export class StatusPageEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateStatusPageDto'],
  BackendType['UpdateStatusPageDto']
> {
  protected readonly chipInputAdd = chipInputAdd;
  protected readonly chipInputRemove = chipInputRemove;

  private readonly api = injectAPI();
  protected readonly monitorsSearchStore = inject(MonitorsSearchStore);

  private readonly oldDomainNames = signal<string[]>([]);

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
    }),
  });
  readonly isValid = injectIsValid(this.form);

  protected readonly domainNameForm = this.fb.nonNullable.group({
    domainName: [
      '',
      [
        Validators.required,
        Validators.pattern(Database.DOMAIN_REGEX),
        Validators.minLength(Database.MIN_DOMAIN_LENGTH),
        Validators.maxLength(Database.MAX_DOMAIN_LENGTH),
      ],
    ],
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

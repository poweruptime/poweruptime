import {HttpClient} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, effect, inject, input, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {NgIcon} from '@ng-icons/core';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmCheckboxImports} from '@spartan-ng/helm/checkbox';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmTextareaImports} from '@spartan-ng/helm/textarea';

import {BackendType} from '@app/api';
import {SelectedTeamStore} from '@app/services';
import {BACKEND_API_URL} from '@app/util';

import {MaintenanceStore} from './maintenance.store';
import {MaintenancePayload} from './maintenance.types';

@Component({
  template: `
    <form class="grid gap-5" [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <a hlmBtn variant="outline" routerLink="../">
            <ng-icon name="bootstrapArrowLeft" hlm size="sm" />
            Back
          </a>
          <h1 class="text-3xl font-semibold">
            {{ maintenanceId() ? 'Edit maintenance' : 'New maintenance' }}
          </h1>
        </div>
        <button [disabled]="form.invalid" hlmBtn type="submit">Save</button>
      </div>

      <section hlmCard>
        <div class="grid gap-4" hlmCardContent>
          <label class="grid gap-2" hlmLabel for="title">
            Title
            <input id="title" hlmInput formControlName="title" />
          </label>

          <label class="grid gap-2" hlmLabel for="description">
            Description
            <textarea
              id="description"
              hlmInput
              hlmTextarea
              rows="4"
              formControlName="description"></textarea>
          </label>

          <label class="flex items-center gap-2" hlmLabel for="start-now">
            <hlm-checkbox id="start-now" formControlName="startNow" />
            Start now
          </label>

          @if (!form.controls.startNow.value) {
            <label class="grid gap-2" hlmLabel>
              Start time
              <input hlmInput type="datetime-local" formControlName="startsAt" />
            </label>
          }

          <label class="grid gap-2" hlmLabel>
            End time
            <input hlmInput type="datetime-local" formControlName="endsAt" />
          </label>

          <label class="grid gap-2" hlmLabel>
            Time zone
            <input hlmInput formControlName="timeZone" />
          </label>
        </div>
      </section>

      <section hlmCard>
        <div class="grid gap-4" hlmCardContent>
          <label class="grid gap-2" hlmLabel>
            Visibility
            <select class="bg-background h-10 rounded-md border px-3" formControlName="visibility">
              <option value="INTERNAL">Internal only</option>
              <option value="PUBLIC">Public</option>
            </select>
          </label>

          <label class="grid gap-2" hlmLabel>
            Alert behavior
            <select
              class="bg-background h-10 rounded-md border px-3"
              formControlName="alertBehavior">
              <option value="SUPPRESS">Suppress</option>
              <option value="DOWNGRADE">Downgrade</option>
              <option value="ALLOW">Allow</option>
            </select>
          </label>

          <div class="grid gap-2">
            <span hlmLabel>Affected monitors</span>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              @for (monitor of monitors(); track monitor.id) {
                <label class="flex items-center gap-2 rounded-md border p-3 text-sm" hlmLabel>
                  <input
                    [checked]="selectedMonitorIds().has(monitor.id)"
                    (change)="toggleMonitor(monitor.id)"
                    type="checkbox" />
                  {{ monitor.name }}
                </label>
              }
            </div>
          </div>
        </div>
      </section>

      <section hlmCard>
        <div class="grid gap-4" hlmCardContent>
          <label class="flex items-center gap-2" hlmLabel for="notifyScheduled">
            <hlm-checkbox id="notifyScheduled" formControlName="notifyScheduled" />
            Notify when scheduled
          </label>
          <label class="flex items-center gap-2" hlmLabel for="notifyStarted">
            <hlm-checkbox id="notifyStarted" formControlName="notifyStarted" />
            Notify when started
          </label>
          <label class="flex items-center gap-2" hlmLabel for="notifyEnded">
            <hlm-checkbox id="notifyEnded" formControlName="notifyEnded" />
            Notify when ended
          </label>
          <label class="grid gap-2" hlmLabel for="reminderOffsetsMinutes">
            Reminder offsets in minutes
            <input
              id="reminderOffsetsMinutes"
              hlmInput
              formControlName="reminderOffsetsMinutes"
              placeholder="15,60" />
          </label>
        </div>
      </section>
    </form>
  `,
  selector: 'pu-maintenance-edit-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmCheckboxImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSelectImports,
    HlmTextareaImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceEditPage {
  readonly maintenanceId = input<string>();
  protected readonly maintenanceStore = inject(MaintenanceStore);
  private readonly selectedTeamStore = inject(SelectedTeamStore);
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  protected readonly monitors = signal<BackendType['MonitorMinResponse'][]>([]);
  protected readonly selectedMonitorIds = signal(new Set<string>());

  protected readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    startNow: [false],
    startsAt: [''],
    endsAt: ['', Validators.required],
    timeZone: [Intl.DateTimeFormat().resolvedOptions().timeZone, Validators.required],
    visibility: this.formBuilder.control<'INTERNAL' | 'PUBLIC'>('INTERNAL'),
    alertBehavior: this.formBuilder.control<'SUPPRESS' | 'DOWNGRADE' | 'ALLOW'>('SUPPRESS'),
    notifyScheduled: [false],
    notifyStarted: [true],
    notifyEnded: [true],
    reminderOffsetsMinutes: ['15'],
  });

  constructor() {
    this.maintenanceStore.loadById(this.maintenanceId);
    this.loadMonitors();

    effect(() => {
      const maintenance = this.maintenanceStore.maintenance();
      if (!maintenance) {
        return;
      }
      this.form.patchValue({
        title: maintenance.title,
        description: maintenance.description ?? '',
        startNow: false,
        startsAt: this.toDateTimeLocal(maintenance.startsAt),
        endsAt: this.toDateTimeLocal(maintenance.endsAt),
        timeZone: maintenance.timeZone,
        visibility: maintenance.visibility,
        alertBehavior: maintenance.alertBehavior,
        notifyScheduled: maintenance.notifyScheduled,
        notifyStarted: maintenance.notifyStarted,
        notifyEnded: maintenance.notifyEnded,
        reminderOffsetsMinutes: maintenance.reminderOffsetsMinutes.join(','),
      });
      this.selectedMonitorIds.set(new Set(maintenance.monitors.map((monitor) => monitor.id)));
    });
  }

  protected toggleMonitor(id: string) {
    this.selectedMonitorIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected submit() {
    const value = this.form.getRawValue();
    const payload: MaintenancePayload = {
      id: this.maintenanceId(),
      teamId: this.selectedTeamStore.selectedTeamId(),
      title: value.title,
      description: value.description || null,
      startNow: value.startNow,
      startsAt: value.startNow ? null : this.toInstant(value.startsAt),
      endsAt: this.toInstant(value.endsAt),
      timeZone: value.timeZone,
      visibility: value.visibility,
      alertBehavior: value.alertBehavior,
      monitorIds: [...this.selectedMonitorIds()],
      notifyScheduled: value.notifyScheduled,
      notifyStarted: value.notifyStarted,
      notifyEnded: value.notifyEnded,
      reminderOffsetsMinutes: value.reminderOffsetsMinutes
        .split(',')
        .map((it) => Number.parseInt(it.trim(), 10))
        .filter((it) => Number.isFinite(it) && it > 0),
    };

    if (this.maintenanceId()) {
      this.maintenanceStore.update(payload);
      return;
    }
    this.maintenanceStore.create(payload);
  }

  private loadMonitors() {
    const teamId = this.selectedTeamStore.selectedTeamId();
    if (!teamId) {
      return;
    }
    this.http
      .get<{data: BackendType['MonitorMinResponse'][]}>(`${BACKEND_API_URL}/v1/monitor`, {
        params: {teamId, page: 0, size: 200},
      })
      .subscribe((response) => this.monitors.set(response.data));
  }

  private toInstant(value: string) {
    return new Date(value).toISOString();
  }

  private toDateTimeLocal(value: string) {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }
}

import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {RouterLink} from '@angular/router';

import {NgIcon} from '@ng-icons/core';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmTabsImports} from '@spartan-ng/helm/tabs';

import {SelectedTeamStore} from '@app/services';

import {MaintenanceStore} from './maintenance.store';
import {MaintenanceState} from './maintenance.types';

@Component({
  template: `
    <div class="grid gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-3xl font-semibold">Maintenance</h1>
        <a hlmBtn routerLink="new">
          <ng-icon name="lucideCirclePlus" hlm size="sm" />
          New maintenance
        </a>
      </div>

      <hlm-tabs [tab]="maintenanceStore.state()" (tabActivated)="setState($event)">
        <hlm-tabs-list class="h-auto p-0.5" aria-label="Maintenance views">
          <button hlmTabsTrigger="UPCOMING" type="button">Upcoming</button>
          <button hlmTabsTrigger="ACTIVE" type="button">Active</button>
          <button hlmTabsTrigger="COMPLETED" type="button">Completed</button>
        </hlm-tabs-list>
      </hlm-tabs>

      @if (maintenanceStore.isEmpty()) {
        <section hlmCard>
          <div class="grid gap-2 text-center" hlmCardContent>
            <ng-icon class="text-muted-foreground mx-auto" name="lucideCalendarClock" size="36" />
            <h2 class="text-lg font-medium">No maintenance windows</h2>
            <p class="text-muted-foreground text-sm">
              Create one-time or start-now maintenance for selected monitors.
            </p>
          </div>
        </section>
      } @else {
        <div class="grid gap-3">
          @for (maintenance of maintenanceStore.maintenances(); track maintenance.id) {
            <section hlmCard>
              <div class="grid gap-3" hlmCardContent>
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="grid gap-1">
                    <a
                      class="text-lg font-medium hover:underline"
                      routerLink="{{ maintenance.id }}">
                      {{ maintenance.title }}
                    </a>
                    <p class="text-muted-foreground text-sm">
                      {{ maintenance.startsAt | date: 'medium' }} -
                      {{ maintenance.endsAt | date: 'medium' }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2 text-sm">
                    <span class="rounded-md border px-2 py-1">{{ maintenance.visibility }}</span>
                    <span class="rounded-md border px-2 py-1">{{ maintenance.alertBehavior }}</span>
                  </div>
                </div>
                @if (maintenance.description) {
                  <p class="text-sm">{{ maintenance.description }}</p>
                }
                <div class="text-muted-foreground text-sm">
                  {{ maintenance.monitors.length }} impacted monitor(s)
                </div>
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
  selector: 'pu-maintenance-page',
  providers: [DatePipe],
  imports: [RouterLink, DatePipe, NgIcon, HlmButtonImports, HlmCardImports, HlmTabsImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenancePage {
  protected readonly maintenanceStore = inject(MaintenanceStore);
  private readonly selectedTeamStore = inject(SelectedTeamStore);

  constructor() {
    this.maintenanceStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        state: this.maintenanceStore.state(),
      })),
    );
  }

  protected setState(state: string) {
    this.maintenanceStore.setState(state as MaintenanceState);
  }
}

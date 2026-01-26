import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {filter, map, of, switchMap, takeUntil, timer} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmContextMenuImports} from '@spartan-ng/helm/context-menu';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {DfxLowerCaseExceptFirstLettersPipe} from 'dfx-helper';

import type {BackendType} from '@app/api';
import {MonitorStatusTextBackground, Tag} from '@app/directives';
import {LastCheckResultsStore, MonitorActionStore} from '@app/services';

import {UptimeTimeline} from '../uptime-timeline';

@Component({
  template: `
    @let _monitor = monitor();
    <a
      class="h-[115px] py-2"
      [hlmContextMenuTrigger]="menu"
      [routerLink]="_monitor.id"
      [queryParamsHandling]="'merge'"
      align="start"
      side="right"
      hlmCard
      routerLinkActive="bg-gray-100 dark:bg-card/5">
      <div class="grid items-start gap-1 rounded-lg px-2" hlmCardContent>
        <div class="flex items-center justify-between gap-2 px-2">
          <h3 class="text-foreground max-w-64 truncate font-medium tracking-tight">
            {{ _monitor.name }}
          </h3>

          <span
            class="rounded-4xl px-2 py-0.5 text-sm"
            [monitor-status-text-background]="_monitor.status"
            mono>
            @if (_monitor.status === 'UP') {
              {{ _monitor.oneDayUptime }}
            } @else {
              {{ _monitor.status | s_lowerCaseAllExceptFirstLetter }}
            }
          </span>
        </div>

        @let _isHovering = isHovering();
        @let hasTags = _monitor.tags.length > 0;
        @if (isLoading()) {
          <div class="flex w-full flex-col gap-2 px-2 pt-2">
            <hlm-skeleton class="h-6 w-full" />

            @if (!hasTags) {
              <div class="flex w-full justify-between">
                <hlm-skeleton class="h-6 w-16" />
                <hlm-skeleton class="h-6 w-16" />
              </div>
            }
          </div>
        } @else {
          <pu-uptime-timeline
            class="min-w-full"
            [hideLabel]="hasTags && !_isHovering"
            [checkResults]="entities()"
            [size]="2"
            (mouseenter)="hoveringTrigger.set(true)"
            (mouseleave)="hoveringTrigger.set(false)" />
        }

        @if (!_isHovering && hasTags) {
          <div
            class="badge-container flex gap-2 overflow-x-auto"
            style="max-width: 19.25rem; padding: 5px">
            @for (tag of _monitor.tags; track tag.name) {
              <span
                class="text-xs whitespace-nowrap"
                [pu-tag]="tag.variant"
                [routerLink]="[]"
                [queryParams]="{'search.show': true, 'search.tag': tag.name}"
                clickable
                queryParamsHandling="merge">
                {{ tag.name }}
              </span>
            }
          </div>
        }
      </div>
    </a>
    <ng-template #menu>
      <hlm-dropdown-menu class="w-52">
        <hlm-dropdown-menu-group>
          @if (_monitor.status === 'PAUSED') {
            <button
              (click)="monitorActionStore.start(_monitor.id)"
              hlmDropdownMenuItem
              type="button">
              <ng-icon hlm size="sm" name="bootstrapPlayBtn" />
              {{ 'general.start' | transloco }}
            </button>
          } @else {
            <button
              (click)="monitorActionStore.pause(_monitor.id)"
              hlmDropdownMenuItem
              type="button">
              <ng-icon hlm size="sm" name="bootstrapPauseBtn" />
              {{ 'general.pause' | transloco }}
            </button>
          }
          <button
            (click)="monitorActionStore.clone({id: _monitor.id})"
            hlmDropdownMenuItem
            type="button">
            <ng-icon hlm name="bootstrapCopy" size="sm" />
            <span>{{ 'general.copy' | transloco }}</span>
          </button>
          <button
            class="hover:bg-destructive/10 dark:hover:bg-destructive/40"
            (click)="monitorActionStore.delete(_monitor.id)"
            type="button"
            hlmDropdownMenuItem
            variant="destructive">
            <ng-icon hlm name="lucideTrash" size="sm" />
            <span>
              {{ 'general.delete' | transloco }}
            </span>
          </button>
        </hlm-dropdown-menu-group>
        <hlm-dropdown-menu-separator />
        <hlm-dropdown-menu-group>
          <a hlmDropdownMenuItem href="/public/m/{{ _monitor.id }}" target="_blank">
            <ng-icon hlm name="bootstrapBoxArrowUpRight" size="sm" />
            <span>{{ 'monitor.details.openPublic' | transloco }}</span>
          </a>
        </hlm-dropdown-menu-group>
      </hlm-dropdown-menu>
    </ng-template>
  `,
  styles: `
    .badge-container {
      -ms-overflow-style: none; /* Internet Explorer 10+ */
      scrollbar-width: none; /* Firefox */
    }
    .badge-container::-webkit-scrollbar {
      display: none; /* Safari and Chrome */
    }
  `,
  selector: 'pu-monitor-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MonitorActionStore],
  imports: [
    RouterLink,
    UptimeTimeline,
    MonitorStatusTextBackground,
    Tag,
    RouterLinkActive,
    DfxLowerCaseExceptFirstLettersPipe,
    TranslocoPipe,
    HlmSkeletonImports,
    HlmCardImports,
    HlmContextMenuImports,
    HlmDropdownMenuImports,
    HlmIconImports,
  ],
})
export class MonitorCard {
  monitor = input.required<BackendType['MonitorResponse']>();

  protected checkResultsStore = inject(LastCheckResultsStore);
  protected readonly monitorActionStore = inject(MonitorActionStore);

  hoveringTrigger = signal(false);
  hoveringTrigger$ = toObservable(this.hoveringTrigger);

  leave$ = this.hoveringTrigger$.pipe(filter((it) => !it));
  isHovering = toSignal(
    this.hoveringTrigger$.pipe(
      switchMap((entered) =>
        entered
          ? timer(200).pipe(
              map(() => true),
              takeUntil(this.leave$),
            )
          : of(false),
      ),
    ),
    {initialValue: false},
  );

  entities = computed(() => this.checkResultsStore.resultsMap().get(this.monitor().id) ?? []);
  isLoading = computed(() => this.checkResultsStore.loading().has(this.monitor().id));
}

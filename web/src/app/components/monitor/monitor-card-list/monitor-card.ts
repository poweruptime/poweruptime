import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {MatCard} from '@angular/material/card';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {filter, map, of, switchMap, takeUntil, timer} from 'rxjs';

import type {BackendType} from '@app/api';
import {MonitorStatusTextBackground, Tag} from '@app/directives';

import {UptimeTimeline} from '../uptime-timeline';

@Component({
  template: `
    @let _monitor = monitor();
    <a [routerLink]="_monitor.id" [queryParamsHandling]="'merge'" style="height: 120px">
      <mat-card routerLinkActive="active-card" appearance="outlined" style="height: 120px">
        <div class="p-3">
          <div class="flex flex-col items-start gap-1 rounded-lg" style="height: 110px">
            <div class="flex max-w-72 items-center gap-1">
              <span
                class="rounded-4xl px-2 py-0.5"
                [monitor-status-text-background]="_monitor.status">
                @if (_monitor.status === 'UP') {
                  {{ _monitor.oneDayUptime }}
                } @else {
                  {{ _monitor.status }}
                }
              </span>
              <span class="truncate">{{ _monitor.name }}</span>
            </div>

            @let _isHovering = isHovering();
            @let hasTags = _monitor.tags.length > 0;
            <pu-uptime-timeline
              class="min-w-full"
              [hideLabel]="hasTags && !_isHovering"
              [checkResults]="_monitor.lastCheckResults"
              [size]="2"
              (mouseenter)="hoveringTrigger.set(true)"
              (mouseleave)="hoveringTrigger.set(false)" />

            @if (!_isHovering && hasTags) {
              <div
                class="badge-container flex gap-2 overflow-x-auto"
                style="max-width: 19.25rem; padding: 5px">
                @for (tag of _monitor.tags; track tag.name) {
                  <span [pu-tag]="tag.variant" clickable>{{ tag.name }}</span>
                }
              </div>
            }
          </div>
        </div>
      </mat-card>
    </a>
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
  imports: [
    RouterLink,
    RouterLinkActive,
    MatCard,
    UptimeTimeline,
    MonitorStatusTextBackground,
    Tag,
  ],
})
export class MonitorCard {
  monitor = input.required<BackendType['MonitorResponse']>();

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
}

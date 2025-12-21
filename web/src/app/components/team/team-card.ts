import {Component, computed, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';
import {injectPattern} from '@app/util';

import {TeamCardMonitorCount} from './team-card-monitor-count';

@Component({
  template: `
    @let _team = team();
    <a [routerLink]="_team.id">
      <div class="group flex h-[230px] flex-col rounded-xl">
        <div
          class="relative h-40 w-full overflow-hidden rounded-t-xl"
          [style.background-color]="'#dfdbe5'">
          <div
            class="absolute inset-0 transition-transform duration-200 group-hover:scale-110"
            [style.background-image]="backgroundPattern()"
            [style.background-position]="'center'"></div>
        </div>
        <div class="rounded-b-xl border-r border-b border-l px-4 pb-4">
          <div class="mt-3 flex items-center justify-between">
            <div class="inline-flex items-center gap-2">
              <span class="text-2xl">{{ _team.name }}</span>
              @if (_team.personal) {
                <mat-chip-set>
                  <mat-chip>{{ 'general.personal' | transloco }}</mat-chip>
                </mat-chip-set>
              }
            </div>

            <a
              [routerLink]="_team.id + '/edit'"
              [attr.aria-label]="'team.settings.settings' | transloco"
              [matTooltip]="'team.settings.settings' | transloco"
              stopPropagation
              mat-icon-button>
              <ng-icon name="bootstrapGear" size="24" aria-hidden="true" />
            </a>
          </div>

          <pu-team-card-monitor-count [team]="_team" />
        </div>
      </div>
    </a>
  `,
  selector: 'pu-team-card',
  imports: [
    MatChipSet,
    MatChip,
    RouterLink,
    NgIcon,
    MatIconAnchor,
    StopPropagationDirective,
    MatTooltip,
    TeamCardMonitorCount,
    TranslocoPipe,
    MatIconButton,
  ],
})
export class TeamCard {
  readonly team = input.required<BackendType['TeamResponse']>();

  readonly backgroundPattern = injectPattern(computed(() => this.team().id));
}

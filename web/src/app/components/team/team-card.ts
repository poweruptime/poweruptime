import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';

import {Pattern} from '../../directives';
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
            [pu-pattern]="_team.id"
            [style.background-position]="'center'"></div>
        </div>
        <div class="rounded-b-xl border-r border-b border-l px-4 pb-4">
          <div class="mt-3 flex items-center justify-between">
            <div class="inline-flex items-center gap-2">
              <span class="text-2xl">{{ _team.name }}</span>
              @if (_team.personal) {
                <span hlmBadge variant="secondary">{{ 'general.personal' | transloco }}</span>
              }
            </div>

            <hlm-tooltip>
              <a
                [routerLink]="_team.id + '/edit'"
                hlmTooltipTrigger
                hlmBtn
                stopPropagation
                variant="ghost"
                size="icon-sm">
                <ng-icon hlm size="sm" name="bootstrapGear" />
              </a>
              <span *brnTooltipContent>{{ 'team.settings.settings' | transloco }}</span>
            </hlm-tooltip>
          </div>

          <pu-team-card-monitor-count [team]="_team" />
        </div>
      </div>
    </a>
  `,
  selector: 'pu-team-card',
  imports: [
    RouterLink,
    StopPropagationDirective,
    TeamCardMonitorCount,
    TranslocoPipe,
    HlmTooltipImports,
    HlmButtonImports,
    HlmIconImports,
    BrnTooltipContentTemplate,
    HlmBadgeImports,
    Pattern,
  ],
})
export class TeamCard {
  readonly team = input.required<BackendType['TeamResponse']>();
}

import {NgOptimizedImage} from '@angular/common';
import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';
import {Pattern} from '@app/directives';
import {BackendImagePipe} from '@app/pipes';

import {TeamCardMonitorCount} from './team-card-monitor-count';

@Component({
  template: `
    @let _team = team();
    <a class="group relative h-[230px] py-0" [routerLink]="_team.id" hlmCard>
      <div
        class="relative z-20 aspect-video h-30 w-full overflow-hidden rounded-t-xl"
        [style.background-color]="'#dfdbe5'">
        <div
          class="absolute inset-0 transition-transform duration-200 group-hover:scale-110"
          [style.background-position]="'center'"
          [pu-pattern]="_team.id"></div>
      </div>
      <hlm-card-header>
        @if (_team.image?.fileId; as fileId) {
          <div class="relative h-0">
            <div class="bg-card absolute -top-20 left-0 z-30 rounded-xl">
              <img
                [ngSrc]="fileId | backendImage"
                [alt]="_team.name + ' logo'"
                width="80"
                height="80" />
            </div>
          </div>
        }
        <div class="flex justify-between">
          <h3 hlmCardTitle>{{ _team.name }}</h3>
          <div class="inline-flex gap-2">
            @if (_team.personal) {
              <span hlmBadge variant="secondary">{{ 'general.personal' | transloco }}</span>
            }
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
        </div>
        <pu-team-card-monitor-count [team]="_team" hlmCardDescription />
      </hlm-card-header>
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
    HlmCardImports,
    NgOptimizedImage,
    BackendImagePipe,
  ],
})
export class TeamCard {
  readonly team = input.required<BackendType['TeamResponse']>();
}

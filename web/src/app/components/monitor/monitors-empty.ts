import {ChangeDetectionStrategy, Component, booleanAttribute, inject, input} from '@angular/core';
import {Router, RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {TeamSelect} from '../team-select';

@Component({
  template: `
    @let _inTeam = inTeam();
    <div hlmEmpty>
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon hlm name="lucideSquareActivity" />
        </div>
        <div hlmEmptyTitle>{{ 'monitor.list.empty.title' | transloco }}</div>
        <div hlmEmptyDescription>{{ 'monitor.list.empty.description' | transloco }}</div>
      </div>
      <div hlmEmptyContent>
        <div class="flex gap-2">
          @if (_inTeam) {
            <a hlmBtn routerLink="../new-monitor">
              <ng-icon hlm name="bootstrapPlusCircle" size="sm" />
              {{ 'monitor.new' | transloco }}
            </a>
          } @else {
            <pu-team-select
              (teamIdChange)="router.navigate(['/', 't', $event, 'new-monitor'])"
              adminOnly>
              <button hlmBtn type="button">{{ 'monitor.new' | transloco }}</button>
            </pu-team-select>
          }
          <a hlmBtn routerLink="/t" variant="outline">
            {{ 'monitor.list.empty.backToTeams' | transloco }}
          </a>
        </div>
      </div>
      @if (_inTeam) {
        <a
          class="text-muted-foreground"
          routerLink="../recycle-bin/monitor"
          hlmBtn
          variant="link"
          size="sm">
          {{ 'general.recycleBin' | transloco }}
          <ng-icon hlm name="lucideArrowUpRight" size="sm" />
        </a>
      }
    </div>
  `,
  selector: 'pu-monitors-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmIconImports,
    HlmEmptyImports,
    HlmButtonImports,
    TranslocoPipe,
    RouterLink,
    TeamSelect,
  ],
})
export class MonitorsEmpty {
  protected readonly router = inject(Router);
  readonly inTeam = input(false, {transform: booleanAttribute});
}

import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Params} from '@angular/router';

import {map, switchMap} from 'rxjs';

import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCollapsibleImports} from '@spartan-ng/helm/collapsible';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {injectIsMobile} from 'dfx-helper';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

@Component({
  template: `
    @let _activeFiltersCount = activeFiltersCount();
    @let hasActiveFilters = _activeFiltersCount > 0;
    @let _isMobile = isMobile();

    <hlm-collapsible [(expanded)]="expanded">
      <ng-template #collapseContent>
        <hlm-collapsible-content
          class="grid grid-cols-1 items-center justify-end gap-4 md:grid-cols-2 lg:flex">
          <ng-content />
        </hlm-collapsible-content>
      </ng-template>

      <div class="flex items-center justify-between">
        <div>
          <ng-content select="[head]" />
        </div>
        <div class="flex items-center gap-2">
          @if (!_isMobile) {
            <ng-template [ngTemplateOutlet]="collapseContent" />
          }
          <button
            class="relative"
            type="button"
            hlmBtn
            hlmCollapsibleTrigger
            variant="outline"
            size="icon">
            <ng-icon [class.rotate-90]="expanded()" hlm name="bootstrapFilter" size="sm" />
            @if (hasActiveFilters) {
              <span
                class="absolute -top-2 left-full flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-red-600 px-1 py-[1px] font-medium text-white">
                {{ _activeFiltersCount }}
              </span>
            }
          </button>
        </div>
      </div>

      @if (_isMobile) {
        <div class="h-2 w-full"></div>
        <ng-template [ngTemplateOutlet]="collapseContent" />
      }
    </hlm-collapsible>
  `,
  selector: 'pu-table-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmIconImports,
    HlmButtonImports,
    HlmCollapsibleImports,
    HlmBadgeImports,
    NgTemplateOutlet,
  ],
})
export class TableFilter {
  private readonly activatedRoute = inject(ActivatedRoute);
  protected readonly isMobile = injectIsMobile();

  key = input('');

  expanded = linkedQueryParam(
    computed(() => `${this.key().length > 0 ? `${this.key()}.` : ''}show`),
    {
      parse: paramToBoolean({defaultValue: false}),
      stringify: (it) => (it === true ? 'true' : null),
    },
  );

  readonly activeFiltersCount = toSignal(
    toObservable(this.key).pipe(
      switchMap((key) => {
        const filterKey = `${key.length > 0 ? `${key}.` : ''}filter.`;

        return this.activatedRoute.queryParams.pipe(
          map((params) => Object.keys(params).filter((it) => it.startsWith(filterKey)).length),
        );
      }),
    ),
    {initialValue: 0},
  );
}

export const hasActiveFilters = (key = '') => {
  const filterKey = `${key.length > 0 ? `${key}.` : ''}filter.`;
  return (params: Params) =>
    Object.keys(params).filter((it) => it.startsWith(filterKey)).length > 0;
};

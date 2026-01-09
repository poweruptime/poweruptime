import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Params} from '@angular/router';

import {map, switchMap} from 'rxjs';

import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCollapsibleImports} from '@spartan-ng/helm/collapsible';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

@Component({
  template: `
    @let _activeFiltersCount = activeFiltersCount();
    @let hasActiveFilters = _activeFiltersCount > 0;
    <div class="flex flex-wrap justify-end">
      <hlm-collapsible
        class="flex flex-col items-end gap-2 lg:flex-row lg:flex-row-reverse lg:items-center lg:justify-end"
        [(expanded)]="expanded">
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
              class="absolute -top-2 left-full flex min-w-5 -translate-x-1/2 items-center justify-center rounded-full px-1 py-[1px]"
              hlmBadge
              variant="destructive">
              {{ _activeFiltersCount }}
            </span>
          }
        </button>
        <hlm-collapsible-content class="grid grid-cols-2 items-center justify-end gap-4 lg:flex">
          <ng-content />
        </hlm-collapsible-content>
      </hlm-collapsible>
    </div>
  `,
  selector: 'pu-table-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmIconImports, HlmButtonImports, HlmCollapsibleImports, HlmBadgeImports],
})
export class TableFilter {
  private readonly activatedRoute = inject(ActivatedRoute);

  key = input('');

  expanded = linkedQueryParam(
    computed(() => `${this.key()}.show`),
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

export const hasActiveFilters = (key: string) => {
  const filterKey = `${key.length > 0 ? `${key}.` : ''}filter.`;
  return (params: Params) =>
    Object.keys(params).filter((it) => it.startsWith(filterKey)).length > 0;
};

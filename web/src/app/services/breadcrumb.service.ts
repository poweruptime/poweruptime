import {inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, ActivatedRouteSnapshot, Data, NavigationEnd, Router} from '@angular/router';

import {map} from 'rxjs';
import {filter} from 'rxjs/operators';

import {createInjectable} from 'ngxtension/create-injectable';

export interface Breadcrumb {
  label: string;
  url: string;
}

export const BreadcrumbService = createInjectable(() => {
  const router = inject(Router);
  const activatedRoute = inject(ActivatedRoute);

  const addBreadcrumb = (
    route: ActivatedRouteSnapshot | null,
    parentUrl: string[],
    breadcrumbs: Breadcrumb[],
  ) => {
    if (route) {
      // Construct the route URL
      const routeUrl = parentUrl.concat(route.url.map((url) => url.path));

      // Add an element for the current route part
      if (route.data['breadcrumb']) {
        const breadcrumb = {
          label: getLabel(route.data),
          url: '/' + routeUrl.join('/'),
        };
        breadcrumbs.push(breadcrumb);
      }

      // Add another element for the next route part
      addBreadcrumb(route.firstChild, routeUrl, breadcrumbs);
    }
  };

  return {
    breadcrumbs: toSignal(
      router.events.pipe(
        // Filter the NavigationEnd events as the breadcrumb is updated only when the route reaches its end
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          // Construct the breadcrumb hierarchy
          const breadcrumbs: Breadcrumb[] = [];
          addBreadcrumb(activatedRoute.snapshot, [], breadcrumbs);

          const seen = new Set<string>();
          return breadcrumbs.filter((breadcrumb) => {
            if (seen.has(breadcrumb.url)) {
              return false;
            }
            seen.add(breadcrumb.url);
            return true;
          });
        }),
      ),
      {initialValue: []},
    ),
  };
});

function getLabel(data: Data) {
  // The breadcrumb can be defined as a static string or as a function to construct the breadcrumb element out of the route data
  return typeof data['breadcrumb'] === 'function' ? data['breadcrumb'](data) : data['breadcrumb'];
}

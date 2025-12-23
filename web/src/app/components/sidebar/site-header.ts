import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBreadCrumbImports} from '@spartan-ng/helm/breadcrumb';
import {HlmSeparatorImports} from '@spartan-ng/helm/separator';
import {HlmSidebarImports} from '@spartan-ng/helm/sidebar';

import {BreadcrumbService} from '../../services';

@Component({
  template: `
    <header class="flex h-16 shrink-0 items-center gap-2">
      <div class="flex items-center gap-2 px-4">
        <button type="button" hlmSidebarTrigger>
          <span class="sr-only">Toggle sidebar</span>
        </button>
        @let _breadcrumbs = breadcrumbs();

        @if (_breadcrumbs.length > 0) {
          <hlm-separator class="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
          <nav hlmBreadcrumb>
            <ol hlmBreadcrumbList>
              @for (breadcrumb of _breadcrumbs; track breadcrumb.label) {
                <li class="hidden sm:block" hlmBreadcrumbItem>
                  <a [link]="breadcrumb.url" hlmBreadcrumbLink>
                    {{ breadcrumb.label | transloco }}
                  </a>
                </li>
                @if (!$last) {
                  <li class="hidden sm:block" hlmBreadcrumbSeparator></li>
                }
              }
            </ol>
          </nav>
        }
      </div>
    </header>
  `,
  selector: 'pu-site-header-inset',
  imports: [HlmSidebarImports, HlmSeparatorImports, HlmBreadCrumbImports, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected breadcrumbs = inject(BreadcrumbService).breadcrumbs;
}

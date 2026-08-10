import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBreadcrumbImports} from '@spartan-ng/helm/breadcrumb';
import {HlmSeparatorImports} from '@spartan-ng/helm/separator';
import {HlmSidebarImports, HlmSidebarService} from '@spartan-ng/helm/sidebar';

import {BreadcrumbService, ChangelogStore, ProfileStore} from '@app/services';

import {ChangelogBadge} from './changelog-badge';
import {VersionCheckBadge} from './version-check-badge';

@Component({
  template: `
    <header class="flex h-16 shrink-0 items-center justify-between gap-2">
      <div class="flex items-center gap-2 px-4">
        <button
          id="sidebar-trigger"
          [attr.data-sidebar-open]="isSidebarOpen()"
          type="button"
          hlmSidebarTrigger>
          <span class="sr-only">{{ 'nav.toggle' | transloco }}</span>
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

      <div class="flex items-center gap-2 px-4">
        @if (changelogStore.newVersionChangelogAvailable()) {
          <pu-changelog-badge />
        } @else {
          @let _profileRole = profileRole();
          @defer (when _profileRole === 'ADMIN') {
            @if (_profileRole === 'ADMIN') {
              <pu-version-check-badge />
            }
          }
        }
      </div>
    </header>
  `,
  selector: 'pu-site-header-inset',
  imports: [
    HlmSidebarImports,
    HlmSeparatorImports,
    HlmBreadcrumbImports,
    TranslocoPipe,
    VersionCheckBadge,
    ChangelogBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly changelogStore = inject(ChangelogStore);

  protected readonly breadcrumbs = inject(BreadcrumbService).breadcrumbs;
  protected readonly profileRole = inject(ProfileStore).role;
  protected readonly isSidebarOpen = inject(HlmSidebarService).openMobile;
}

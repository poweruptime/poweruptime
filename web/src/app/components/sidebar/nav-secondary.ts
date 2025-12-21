import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {MatDialog} from '@angular/material/dialog';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmSidebarImports} from '@spartan-ng/helm/sidebar';

import {HelpDialog} from '@app/components/help-dialog';
import {IsSystemAdmin} from '@app/directives';

@Component({
  template: `
    <hlm-sidebar-group>
      <div hlmSidebarGroupContent>
        <ul hlmSidebarMenu>
          <li hlmSidebarMenuItem>
            <button (click)="openHelp()" type="button" hlmSidebarMenuButton size="sm">
              <ng-icon name="bootstrapQuestionCircle" />
              {{ 'general.help' | transloco }}
            </button>
          </li>
          <li hlmSidebarMenuItem>
            <a
              href="https://github.com/poweruptime/poweruptime/discussions/categories/feature-requests-ideas"
              target="_blank"
              rel="noopener"
              hlmSidebarMenuButton
              size="sm">
              <ng-icon name="lucideSend" />
              Feedback
            </a>
          </li>
          <li *isSystemAdmin hlmSidebarMenuItem>
            <a
              #rla="routerLinkActive"
              [isActive]="rla.isActive"
              routerLink="/settings"
              routerLinkActive
              hlmSidebarMenuButton
              size="sm">
              <ng-icon name="bootstrapBuildingGear" />
              {{ 'nav.instanceSettings' | transloco }}
            </a>
          </li>
        </ul>
      </div>
    </hlm-sidebar-group>
  `,
  selector: 'nav-secondary',
  imports: [HlmSidebarImports, NgIcon, TranslocoPipe, RouterLink, IsSystemAdmin, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavSecondary {
  private readonly dialog = inject(MatDialog);

  openHelp() {
    this.dialog.open(HelpDialog);
  }
}

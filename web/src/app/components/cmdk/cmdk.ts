import {NgStyle} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {Router} from '@angular/router';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {CmdkModule} from '@ngxpert/cmdk';
import {BiComponent, BiName} from 'dfx-bootstrap-icons';
import {DfxAutofocus} from 'dfx-helper';

import {ThemeService, themeOptions} from '@app/components';
import {AuthStore, InstanceSettingsStore, ProfileStore, SelectedTeamStore} from '@app/services';

import {CmdkMonitorList} from './cmdk-monitor-list';
import {CmdkTeamList} from './cmdk-team-list';

@Component({
  template: `
    <div class="vercel min-h-96 w-[640px]">
      <cmdk-command
        [ngStyle]="{transform: styleTransform()}"
        [loop]="true"
        [filter]="listFilter()"
        (keydown)="onKeyDown($event)">
        @let _activePage = activePage();

        <div></div>
        <mat-chip-set aria-label="Page selection" style="text-transform: capitalize">
          @for (p of pages(); track p) {
            <mat-chip>{{ p }}</mat-chip>
          }
        </mat-chip-set>
        <input
          [formControl]="searchControl"
          [value]="searchValue()"
          [placeholder]="
            _activePage === 'create monitor' ||
            _activePage === 'teams' ||
            _activePage === 'create notification method' ||
            _activePage === 'create status page'
              ? ('cmdk.groups.team.input' | transloco)
              : _activePage === 'monitors'
                ? ('cmdk.groups.monitor.input' | transloco)
                : _activePage === 'switch theme'
                  ? ('cmdk.groups.theme.input' | transloco)
                  : _activePage === 'notification methods'
                    ? ('cmdk.groups.notificationMethod.input' | transloco)
                    : _activePage === 'status pages'
                      ? ('cmdk.groups.statusPage.input' | transloco)
                      : ('cmdk.groups.general.input' | transloco)
          "
          cmdkInput
          focus />
        <cmdk-list>
          @let _isHome = isHome();

          @if (_isHome) {
            <div *cmdkEmpty>{{ 'cmdk.results.empty' | transloco }}</div>
          }

          @if (_isHome) {
            @for (group of groups(); track group.group) {
              <cmdk-group [label]="group.group">
                @for (item of group.items; track item.label) {
                  @if (item.separatorOnTop) {
                    <cmdk-separator></cmdk-separator>
                  }
                  <button
                    [value]="item.label | transloco"
                    (selected)="item.itemSelected && item.itemSelected()"
                    cmdkItem>
                    <bi [name]="item.icon" />
                    {{ item.label | transloco }}
                    @if (item.shortcut) {
                      <div class="cmdk-vercel-shortcuts">
                        @for (key of item.shortcut.split(' '); track key) {
                          <kbd>{{ key }}</kbd>
                        }
                      </div>
                    }
                  </button>
                }
              </cmdk-group>
            }
          }
          @defer (when _activePage === 'teams') {
            @if (_activePage === 'teams') {
              <pu-cmdk-team-list
                [searchValue]="searchValue()"
                (selected)="navigateAndClose(['/', 't', $event, 'm'])" />
            }
          }

          @if (_activePage === 'monitors') {
            <pu-cmdk-monitor-list
              [searchValue]="searchValue()"
              (selected)="navigateAndClose(['/', 't', $event.team.id, 'm', $event.id])" />
          }

          @defer (when _activePage === 'create monitor') {
            @if (_activePage === 'create monitor') {
              <pu-cmdk-team-list
                [searchValue]="searchValue()"
                (selected)="navigateAndClose(['/', 't', $event, 'm', 'new'])" />
            }
          }

          @defer (when _activePage === 'create notification method') {
            @if (_activePage === 'create notification method') {
              <pu-cmdk-team-list
                [searchValue]="searchValue()"
                (selected)="navigateAndClose(['/', 't', $event, 'notification-methods', 'new'])" />
            }
          }

          @defer (when _activePage === 'create status page') {
            @if (_activePage === 'create status page') {
              <pu-cmdk-team-list
                [searchValue]="searchValue()"
                (selected)="navigateAndClose(['/', 't', $event, 'status-pages', 'new'])" />
            }
          }

          @defer (when _activePage === 'switch theme') {
            @if (_activePage === 'switch theme') {
              @for (theme of themeOptions; track theme.value) {
                <button
                  [value]="theme.viewValue"
                  (selected)="themeService.selectedTheme.set(theme.value); popPage()"
                  cmdkItem>
                  {{ theme.viewValue }}
                </button>
              }
            }
          }
        </cmdk-list>
      </cmdk-command>
    </div>
  `,
  selector: 'pu-cmdk',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CmdkModule,
    NgStyle,
    BiComponent,
    DfxAutofocus,
    ReactiveFormsModule,
    MatChip,
    MatChipSet,
    CmdkTeamList,
    CmdkMonitorList,
    TranslocoPipe,
  ],
})
export class Cmdk {
  readonly router = inject(Router);
  readonly selectedTeamId = inject(SelectedTeamStore).selectedTeamId;
  readonly authStore = inject(AuthStore);
  readonly profileStore = inject(ProfileStore);
  readonly themeService = inject(ThemeService);
  readonly themeOptions = themeOptions;
  readonly instanceSettingsStore = inject(InstanceSettingsStore);

  close = output();

  styleTransform = signal('');

  searchControl = new FormControl('');
  searchValue = toSignal(this.searchControl.valueChanges.pipe(map((it) => it ?? '')), {
    initialValue: '',
  });

  /**
   * t(cmdk.groups.monitor.search, cmdk.groups.monitor.create, cmdk.groups.team.search, cmdk.groups.team.create, general.logout, cmdk.groups.theme.switch, profile.settings)
   */
  readonly groups: Signal<
    {
      group: string;
      items: {
        label: string;
        itemSelected?: () => void;
        icon: BiName;
        shortcut: string;
        separatorOnTop?: boolean;
      }[];
    }[]
  > = computed(() => {
    const isSystemAdmin = this.profileStore.role() === 'ADMIN';
    const isUserAllowedToCreateTeams =
      this.instanceSettingsStore.settings()?.isUserAllowedToCreateTeams;
    return [
      {
        group: 'Monitors',
        items: [
          {
            label: 'cmdk.groups.monitor.search',
            itemSelected: () => this.setPage('monitors'),
            icon: 'search',
            shortcut: 'Alt M',
          },
          {
            label: 'cmdk.groups.monitor.create',
            itemSelected: () => {
              if (this.selectedTeamId()) {
                this.close.emit();
                void this.router.navigate(['/', 't', this.selectedTeamId()!!, 'm', 'new']);
                return;
              }

              this.setPage('create monitor');
            },
            icon: 'speedometer2',
            shortcut: '',
          },
        ],
      },
      {
        group: 'Teams',
        items: [
          {
            label: 'cmdk.groups.team.search',
            itemSelected: () => this.setPage('teams'),
            icon: 'search',
            shortcut: 'Alt T',
          },
          ...(isSystemAdmin || isUserAllowedToCreateTeams
            ? [
                {
                  label: 'cmdk.groups.team.create',
                  itemSelected: () => {
                    this.close.emit();
                    void this.router.navigate(['/', 't', 'new']);
                  },
                  icon: 'people-fill' as BiName,
                  shortcut: '',
                },
              ]
            : []),
        ],
      },
      {
        group: 'Notification methods',
        items: [
          {
            label: 'cmdk.groups.notificationMethod.search',
            itemSelected: () => this.setPage('notification methods'),
            icon: 'search',
            shortcut: 'Alt N',
          },
          {
            label: 'cmdk.groups.notificationMethod.create',
            itemSelected: () => {
              if (this.selectedTeamId()) {
                this.close.emit();
                void this.router.navigate([
                  '/',
                  't',
                  this.selectedTeamId()!!,
                  'notification-methods',
                  'new',
                ]);
                return;
              }

              this.setPage('create notification method');
            },
            icon: 'bell',
            shortcut: '',
          },
        ],
      },
      {
        group: 'Status pages',
        items: [
          {
            label: 'cmdk.groups.statusPage.search',
            itemSelected: () => this.setPage('status pages'),
            icon: 'search',
            shortcut: 'Alt S',
          },
          {
            label: 'cmdk.groups.statusPage.create',
            itemSelected: () => {
              if (this.selectedTeamId()) {
                this.close.emit();
                void this.router.navigate([
                  '/',
                  't',
                  this.selectedTeamId()!!,
                  'status-pages',
                  'new',
                ]);
                return;
              }

              this.setPage('create status page');
            },
            icon: 'chat-left-quote',
            shortcut: '',
          },
        ],
      },
      {
        group: 'General',
        items: [
          {
            label: 'profile.settings',
            itemSelected: () => this.navigateAndClose(['/', 'profile', 'overview']),
            icon: 'gear',
            shortcut: '',
          },
          {
            label: 'cmdk.groups.theme.switch',
            itemSelected: () => this.setPage('switch theme'),
            icon: 'palette',
            shortcut: '',
          },
          {
            label: 'general.logout',
            itemSelected: () => this.authStore.logout(),
            icon: 'box-arrow-right',
            shortcut: '',
          },
        ],
      },
    ];
  });

  pages = model(['home']);

  activePage = computed(() => {
    return this.pages()[this.pages().length - 1];
  });

  isHome = computed(() => {
    return this.activePage() === 'home';
  });

  listFilter = computed(() =>
    this.activePage() === 'home' || this.activePage() === 'switch theme'
      ? (value: string, search: string) =>
          value.trim().toLowerCase().includes(search.trim().toLowerCase())
      : (_: string, _1: string) => true,
  );

  constructor() {
    this.instanceSettingsStore.load();
  }

  navigateAndClose(commands: string[]): void {
    this.close.emit();
    void this.router.navigate(commands);
  }

  onKeyDown(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') {
      this.close.emit();
      return;
    }

    if (ev.key === 'Enter') {
      this.bounce();
    }

    // @ts-ignore
    if (this.isHome() || ev.target.value.length) {
      return;
    }

    if (ev.key === 'Backspace') {
      ev.preventDefault();
      this.popPage();
      this.bounce();
    }
  }

  popPage() {
    this.searchControl.setValue('');
    this.pages.update((pages) => {
      return [...pages.slice(0, pages.length - 1)];
    });
  }

  bounce() {
    this.styleTransform.set('scale(0.96)');
    setTimeout(() => {
      this.styleTransform.set('');
    }, 100);
  }

  setPage(page: string) {
    this.searchControl.setValue('');
    this.pages.update((pages) => [...pages, page]);
  }
}

import {NgStyle} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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

import {CmdkModule} from '@ngxpert/cmdk';
import {BiComponent, BiName} from 'dfx-bootstrap-icons';
import {DfxAutofocus} from 'dfx-helper';

import {SelectedTeamStore} from '@app/services';

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
        <mat-chip-set aria-label="Fish selection" style="text-transform: capitalize">
          @for (p of pages(); track p) {
            <mat-chip>{{ p }}</mat-chip>
          }
        </mat-chip-set>
        <input
          [formControl]="searchControl"
          [value]="searchValue()"
          [placeholder]="
            _activePage === 'create monitor' || _activePage === 'teams'
              ? 'Search for a team'
              : _activePage === 'monitors'
                ? 'Search for a monitor'
                : 'What do you need?'
          "
          cmdkInput
          focus />
        <cmdk-list>
          @let _isHome = isHome();

          @if (_isHome) {
            <div *cmdkEmpty>No results found.</div>
          }

          @if (_isHome) {
            @for (group of groups; track group.group) {
              <cmdk-group [label]="group.group">
                @for (item of group.items; track item.label) {
                  @if (item.separatorOnTop) {
                    <cmdk-separator></cmdk-separator>
                  }
                  <button
                    [value]="item.label"
                    (selected)="item.itemSelected && item.itemSelected()"
                    cmdkItem>
                    <bi [name]="item.icon" />
                    {{ item.label }}
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

          @defer (when _activePage === 'teams') {
            @if (_activePage === 'teams') {
              <pu-cmdk-team-list
                [searchValue]="searchValue()"
                (selected)="navigateAndClose(['/', 't', $event, 'm'])" />
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
  ],
})
export class Cmdk {
  router = inject(Router);
  selectedTeamId = inject(SelectedTeamStore).selectedTeamId;

  close = output();

  styleTransform = signal('');

  searchControl = new FormControl('');
  searchValue = toSignal(this.searchControl.valueChanges.pipe(map((it) => it ?? '')), {
    initialValue: '',
  });

  readonly groups: {
    group: string;
    items: {
      label: string;
      itemSelected?: () => void;
      icon: BiName;
      shortcut: string;
      separatorOnTop?: boolean;
    }[];
  }[] = [
    {
      group: 'Monitors',
      items: [
        {
          label: 'Search Monitors...',
          itemSelected: () => this.setPage('monitors'),
          icon: 'search',
          shortcut: 'Alt M',
        },
        {
          label: 'Create New Monitor',
          itemSelected: () => {
            if (this.selectedTeamId()) {
              this.close.emit();
              void this.router.navigate(['/', 't', this.selectedTeamId()!!, 'm', 'new']);
              return;
            }

            this.setPage('create monitor');
          },
          icon: 'cloud-check-fill',
          shortcut: '',
        },
      ],
    },
    {
      group: 'Teams',
      items: [
        {
          label: 'Search Teams...',
          itemSelected: () => this.setPage('teams'),
          icon: 'search',
          shortcut: 'Alt T',
        },
        {
          label: 'Create New Team',
          itemSelected: () => {
            this.close.emit();
            void this.router.navigate(['/', 'teams', 'new']);
          },
          icon: 'people-fill',
          shortcut: '',
        },
      ],
    },
  ];

  pages = model(['home']);

  activePage = computed(() => {
    return this.pages()[this.pages().length - 1];
  });

  isHome = computed(() => {
    return this.activePage() === 'home';
  });

  listFilter = computed(() =>
    this.activePage() === 'home'
      ? (value: string, search: string) => value.toLowerCase().includes(search.toLowerCase())
      : (_: string, _1: string) => true,
  );

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

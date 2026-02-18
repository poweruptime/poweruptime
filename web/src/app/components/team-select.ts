import {NgOptimizedImage} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmAvatarImports} from '@spartan-ng/helm/avatar';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmPopoverImports} from '@spartan-ng/helm/popover';
import {HlmProgressImports} from '@spartan-ng/helm/progress';

import {BackendType} from '@app/api';
import {Pattern} from '@app/directives';
import {BackendImagePipe} from '@app/pipes';
import {TeamsStore} from '@app/services';

@Component({
  selector: 'pu-team-select-item',
  template: `
    @let _team = team();
    <button
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
      [class.bg-accent]="isSelected()"
      (click)="selectEmit.emit()"
      type="button">
      <hlm-avatar class="size-8 rounded-lg after:rounded-lg">
        @if (_team.image?.fileId; as fileId) {
          <img
            class="rounded-lg"
            [ngSrc]="fileId | backendImage"
            [alt]="_team.name + ' logo'"
            priority
            hlmAvatarImage
            width="32"
            height="32" />
        }
        <span hlmAvatarFallback>
          <div class="aspect-square size-8 rounded-lg" [pu-pattern]="_team.id"></div>
        </span>
      </hlm-avatar>
      <div class="flex-1">
        <div class="text-foreground max-w-44 truncate text-sm font-medium">
          {{ team().name }}
        </div>
      </div>
      @if (isSelected()) {
        <ng-icon hlm size="lg" name="lucideCheck" />
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmIconImports, Pattern, BackendImagePipe, NgOptimizedImage, HlmAvatarImports],
})
export class TeamItemComponent {
  team = input.required<BackendType['TeamResponse']>();
  isSelected = input.required<boolean>();
  selectEmit = output<void>();
}

@Component({
  template: `
    <hlm-popover sideOffset="5">
      <div hlmPopoverTrigger>
        <ng-content />
      </div>
      <div class="grid w-80 gap-6" *hlmPopoverPortal="let ctx" hlmPopoverContent>
        <div class="full" hlmInputGroup>
          <div hlmInputGroupAddon>
            <ng-icon hlm name="bootstrapSearch" size="sm" />
          </div>
          <input
            [(ngModel)]="searchFilter"
            [placeholder]="'general.search' | transloco"
            hlmInputGroupInput />
          @if (searchFilter().length > 0) {
            <button (click)="searchFilter.set('')" hlmInputGroupButton type="button">
              <ng-icon hlm name="bootstrapXLg" size="sm" />
              <span class="sr-only">{{ 'general.clear' | transloco }}</span>
            </button>
          }
        </div>

        @let _teamId = teamId();

        @if (teamsStore.personalTeam(); as personalTeam) {
          <div class="grid gap-2">
            <div class="flex items-center gap-2">
              <ng-icon hlm size="sm" name="lucideUser" />
              <span class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {{ 'nav.teamSelect.personal' | transloco }}
              </span>
            </div>

            <pu-team-select-item
              [team]="personalTeam"
              [isSelected]="personalTeam.id === _teamId"
              (selectEmit)="teamId.set(personalTeam.id)" />
          </div>
        }

        @let entities = teamsStore.sortedEntitiesWithoutYourPersonal();
        @if (entities.length > 0) {
          <div class="grid gap-2">
            <div class="flex items-center gap-2">
              <ng-icon hlm size="sm" name="lucideUsers" />
              <span class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {{ 'general.teams' | transloco }}
              </span>
            </div>

            @for (team of entities; track team.id) {
              <pu-team-select-item
                [team]="team"
                [isSelected]="team.id === _teamId"
                (selectEmit)="teamId.set(team.id)" />
            }
          </div>
        }

        @if (teamsStore.isEmpty()) {
          <span>{{ 'general.nothingFound' | transloco }}</span>
        }

        @if (teamsStore.isPending()) {
          <hlm-progress>
            <hlm-progress-indicator />
          </hlm-progress>
        }
      </div>
    </hlm-popover>
  `,
  providers: [TeamsStore],
  selector: 'pu-team-select',
  imports: [
    TeamItemComponent,
    FormsModule,
    TranslocoPipe,
    HlmPopoverImports,
    HlmIconImports,
    HlmInputGroupImports,
    HlmProgressImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSelect {
  protected readonly teamsStore = inject(TeamsStore);

  teamId = model<string | undefined>(undefined);

  readonly adminOnly = input(false, {transform: booleanAttribute});

  protected readonly searchFilter = signal('');

  constructor() {
    this.teamsStore.setName(this.searchFilter);
    this.teamsStore.setRole(computed(() => (this.adminOnly() ? 'ADMIN' : undefined)));

    this.teamsStore.load(
      computed(() => ({
        page: 0,
        size: 10,
        name: this.teamsStore.name(),
        role: this.teamsStore.role(),
        sort: ['personalUser.id_asc', 'name_asc'],
      })),
    );
  }
}

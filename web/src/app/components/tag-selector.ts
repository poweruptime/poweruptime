import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

import {LiveAnnouncer} from '@angular/cdk/a11y';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnPopoverContent} from '@spartan-ng/brain/popover';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmAutocompleteImports} from '@spartan-ng/helm/autocomplete';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSpinnerImports} from '@spartan-ng/helm/spinner';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {DfxLowerCaseExceptFirstLettersPipe, StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';
import {Tag} from '@app/directives';

@Component({
  template: `
    <div class="flex items-end gap-2">
      <hlm-autocomplete-search
        class="w-full"
        [(value)]="tagInput"
        [(search)]="searchTag"
        [disabled]="isDisabled()"
        [restoreFocus]="false">
        <hlm-autocomplete-input
          class="w-full"
          [placeholder]="'tag.selector.selected' | transloco"
          (keydown.enter)="add(tagInput())" />
        <div *brnPopoverContent hlmAutocompleteContent>
          @if (isPending()) {
            <hlm-autocomplete-status class="justify-center">
              <hlm-spinner />
              Loading...
            </hlm-autocomplete-status>
          }
          <hlm-autocomplete-empty>Add a new one</hlm-autocomplete-empty>
          <div hlmAutocompleteList>
            @for (tag of filteredTags(); track tag) {
              <hlm-autocomplete-item [value]="tag" (click)="select(tag)">
                {{ tag.name }}
              </hlm-autocomplete-item>
            }
          </div>
        </div>
      </hlm-autocomplete-search>
      <hlm-tooltip>
        <button (click)="add(tagInput())" hlmBtn hlmTooltipTrigger variant="outline" type="button">
          <ng-icon hlm name="lucideCirclePlus" size="sm" />
        </button>
        <span *brnTooltipContent>
          {{ 'tag.selector.add' | transloco }}
        </span>
      </hlm-tooltip>
    </div>

    <div class="flex flex-wrap gap-2">
      @for (tag of value(); track $index) {
        <button [pu-tag]="tag.variant" [hlmDropdownMenuTrigger]="menu" type="button">
          <div class="flex items-center justify-center gap-1">
            <span>{{ tag.name }}</span>
            <button
              [attr.aria-label]="'tag.selector.remove' | transloco: tag"
              (click)="remove(tag)"
              stopPropagation
              hlmBtn
              variant="ghost"
              size="icon-xs"
              type="button">
              <ng-icon hlm name="lucideX" size="xs" />
            </button>
          </div>
        </button>

        <ng-template #menu>
          <hlm-dropdown-menu class="w-56">
            <hlm-dropdown-menu-label>Variant</hlm-dropdown-menu-label>
            <hlm-dropdown-menu-separator />
            <hlm-dropdown-menu-group>
              @for (tagVariant of tagVariants; track tagVariant) {
                <button
                  [checked]="tag.variant === tagVariant"
                  (triggered)="updateTagVariant(tag, tagVariant)"
                  hlmDropdownMenuCheckbox
                  type="button">
                  <hlm-dropdown-menu-checkbox-indicator />
                  {{ tagVariant | s_lowerCaseAllExceptFirstLetter }}
                </button>
              }
            </hlm-dropdown-menu-group>
          </hlm-dropdown-menu>
        </ng-template>
      }
    </div>
  `,
  selector: 'pu-tag-selector',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagSelector),
      multi: true,
    },
  ],
  imports: [
    StopPropagationDirective,
    Tag,
    DfxLowerCaseExceptFirstLettersPipe,
    FormsModule,
    TranslocoPipe,
    HlmAutocompleteImports,
    HlmButtonImports,
    HlmIconImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
    BrnPopoverContent,
    HlmDropdownMenuImports,
    HlmSpinnerImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagSelector implements ControlValueAccessor {
  private readonly announcer = inject(LiveAnnouncer);

  tagVariants: BackendType['TagDto']['variant'][] = [
    'RED' as const,
    'BLUE' as const,
    'GREEN' as const,
    'PINK' as const,
    'YELLOW' as const,
  ];

  public readonly tags = input.required<BackendType['TagDto'][]>();
  public readonly isPending = input.required<boolean>();
  public readonly searchTag = model('');

  protected readonly tagInput = signal<string | null>(null);

  protected readonly filteredTags = computed(() => {
    const selectedTags = this.value()?.map((it) => it.name);
    return this.tags().filter((it) => !selectedTags?.includes(it.name));
  });

  protected remove(tag: BackendType['TagDto']): void {
    this.value.update((selectedTags) => {
      if (!selectedTags) {
        return null;
      }

      const index = selectedTags.findIndex((it) => it.name === tag.name);
      if (index < 0) {
        return selectedTags;
      }

      selectedTags.splice(index, 1);
      void this.announcer.announce(`Removed ${tag.name}`);
      return [...selectedTags];
    });
  }

  protected add(tag: string | null) {
    if (!tag) {
      return;
    }

    this.select({
      name: tag,
      variant: 'BLUE',
    });
  }

  protected select(tag: BackendType['TagDto']) {
    this.value.update((selectedTags) => [...(selectedTags ?? []), tag]);
    this.tagInput.set('');
    this.searchTag.set('');
  }

  protected updateTagVariant(
    tag: BackendType['TagDto'],
    variant: BackendType['TagDto']['variant'],
  ) {
    this.value.update((selectedTags) => {
      const index = selectedTags?.findIndex((it) => it.name === tag.name) ?? -1;

      if (index === -1 || !selectedTags) {
        return selectedTags;
      }

      const updatedTag = {
        ...selectedTags[index],
        variant: variant,
      };

      return [...selectedTags.slice(0, index), updatedTag, ...selectedTags.slice(index + 1)];
    });
  }

  protected readonly value = signal<BackendType['TagDto'][] | null>(null);
  protected readonly isDisabled = signal(false);
  protected onChange?: (it: BackendType['TagDto'][] | null) => void;

  constructor() {
    effect(() => {
      this.onChange?.(this.value());
    });
  }

  writeValue(it: BackendType['TagDto'][]): void {
    this.value.set(it);
  }
  registerOnChange(fn: (it: BackendType['TagDto'][] | null) => void): void {
    this.onChange = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
  registerOnTouched(_: unknown): void {}
}

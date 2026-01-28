import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  LOCALE_ID,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

import {HlmMentionImports} from '@dafnik/mention';
import {TranslocoPipe} from '@jsverse/transloco';
import {BrnPopoverContent} from '@spartan-ng/brain/popover';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {ShadowRender} from '@app/components';
import {Editor} from '@app/components/editor';

@Component({
  template: `
    @let _label = label();
    @let _html = html();

    <div class="flex flex-col gap-4">
      <div class="w-full space-y-2">
        <div class="flex items-end justify-between gap-4">
          <label for="editor" hlmLabel>
            {{ _label }}
          </label>
          @if (showReset()) {
            <div class="flex justify-end" [class.pt-2]="_html">
              <hlm-tooltip>
                <button
                  [disabled]="disableReset()"
                  (click)="resetClick.emit()"
                  hlmTooltipTrigger
                  hlmBtn
                  type="button"
                  variant="outline"
                  size="icon-sm">
                  <ng-icon hlm size="sm" name="bootstrapArrowCounterclockwise" />
                </button>
                <span *brnTooltipContent>{{ 'general.reset' | transloco }}</span>
              </hlm-tooltip>
            </div>
          }
        </div>
        @if (_html) {
          <pu-editor
            [(ngModel)]="value"
            [placeholder]="_label"
            [autocompleteVariables]="variableKeys" />
        } @else {
          <hlm-mention-search
            class="w-full"
            [(search)]="mentionFilter"
            [(value)]="value"
            [disabled]="isDisabled()"
            [restoreFocus]="false">
            <hlm-mention-input class="w-full" id="editor" [placeholder]="_label" />
            <div *brnPopoverContent hlmMentionContent>
              <hlm-mention-empty>Nothing found...</hlm-mention-empty>
              <div hlmMentionList>
                @for (option of filteredItems(); track option) {
                  <hlm-mention-item [value]="option.key">
                    {{ option.key }}
                  </hlm-mention-item>
                }
              </div>
            </div>
          </hlm-mention-search>
        }
      </div>

      <div
        class="dark:bg-bg-dark relative min-h-24 rounded-sm border border-1 border-dashed border-gray-500 bg-white"
        [class.px-4]="_html"
        [class.p-4]="!_html">
        <span
          class="dark:bg-bg-dark absolute -top-2 left-4 rounded-xl bg-white px-1 text-xs text-gray-500 dark:text-gray-400">
          {{ 'general.preview' | transloco }}
        </span>

        @if (_html) {
          <pu-shadow-render [html]="preview()" />
        } @else {
          <div class="whitespace-pre-wrap">{{ preview() }}</div>
        }
      </div>
    </div>
  `,
  selector: 'pu-notification-method-edit-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NotificationMethodEditTemplate),
      multi: true,
    },
  ],
  imports: [
    Editor,
    ShadowRender,
    FormsModule,
    TranslocoPipe,
    HlmButtonImports,
    HlmIconImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
    HlmMentionImports,
    HlmLabelImports,
    BrnPopoverContent,
  ],
})
export class NotificationMethodEditTemplate implements ControlValueAccessor {
  private readonly locale = inject(LOCALE_ID);
  private readonly dateFormat = new DatePipe(this.locale);
  private readonly document = inject(DOCUMENT);
  private readonly now = this.dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS z (Z)');

  label = input.required<string>();
  html = input(false, {transform: booleanAttribute});

  showReset = input(false, {transform: booleanAttribute});
  disableReset = input(false, {transform: booleanAttribute});
  resetClick = output();

  value = signal<string | null>('');
  isDisabled = signal(false);
  onChange?: (it: string | null) => void;

  readonly variables = [
    {key: 'monitorName', default: 'First monitor'},
    {key: 'status', default: '✅UP'},
    {key: 'title', default: '200 - OK'},
    {key: 'pingMs', default: '420'},
    {key: 'checkStartedAt', default: this.now ?? ''},
    {key: 'message', default: 'Detailed message :)'},
    {key: 'checkResultLink', default: `https://${this.document.location.host}/m/1234/c/5678/logs`},
    {key: 'previousStatusLabel', default: 'Online'},
    {key: 'previousStatusDuration', default: '4d 20h 69m 12s'},
  ];

  readonly variableKeys = this.variables.map((it) => it.key);

  mentionFilter = signal('');
  filteredItems = computed(() => {
    const filter = this.mentionFilter().trim().toLowerCase();
    return this.variables.filter((it) => it.key.trim().toLowerCase().includes(filter)).sort();
  });

  preview = computed(() => {
    let value = this.value();
    if (!value) {
      return '';
    }

    this.variables.forEach((it) => (value = value!!.replaceAll('!' + it.key, it.default)));

    return value;
  });

  constructor() {
    effect(() => {
      this.onChange?.(this.value());
    });
  }

  writeValue(it: string): void {
    this.value.set(it);
  }
  registerOnChange(fn: (it: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(_: any): void {}
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}

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

import {MatAutocomplete, MatOption} from '@angular/material/autocomplete';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {CdkTextareaAutosize} from '@angular/cdk/text-field';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {MentionAutocompleteTrigger, ShadowRender} from '@app/components';
import {Editor} from '@app/components/editor';

@Component({
  template: `
    @let _label = label();
    @let _html = html();

    <div class="flex flex-col">
      @if (_html) {
        <pu-editor [(ngModel)]="value" [placeholder]="_label" [autocompleteVariables]="variables" />
      } @else {
        <mat-form-field>
          <mat-label>{{ _label }}</mat-label>
          <textarea
            class="flex"
            [(mentionFilter)]="mentionFilter"
            [(ngModel)]="value"
            [matMentions]="auto"
            [disabled]="isDisabled()"
            style="width: 36rem"
            mentionTriggerChar="!"
            rows="3"
            matInput
            cdkTextareaAutosize
            cdkAutosizeMinRows="3"></textarea>
        </mat-form-field>
        <mat-autocomplete #auto="matAutocomplete" autoActiveFirstOption>
          @for (option of filteredItems(); track option) {
            <mat-option [value]="option">{{ option }}</mat-option>
          }
        </mat-autocomplete>
      }
      @if (showReset()) {
        <div class="flex justify-end" [class.pt-2]="_html">
          <button
            [disabled]="disableReset()"
            (click)="resetClick.emit()"
            type="button"
            mat-stroked-button>
            <bi name="arrow-counterclockwise" />
            Reset
          </button>
        </div>
      }

      <div
        class="border-1 dark:bg-bg-dark relative mt-4 min-h-24 rounded-sm border border-dashed border-gray-500 bg-white"
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
    FormsModule,
    MatFormField,
    MatInput,
    MatOption,
    MatLabel,
    MatAutocomplete,
    MentionAutocompleteTrigger,
    CdkTextareaAutosize,
    Editor,
    ShadowRender,
    TranslocoPipe,
    MatButton,
    BiComponent,
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

  variables = [
    'monitorName',
    'status',
    'title',
    'pingMs',
    'checkStartedAt',
    'message',
    'checkResultLink',
  ];

  mentionFilter = signal('');
  filteredItems = computed(() => {
    const filter = this.mentionFilter().trim().toLowerCase();
    return this.variables.filter((it) => it.trim().toLowerCase().includes(filter)).sort();
  });

  preview = computed(
    () =>
      this.value()
        ?.replaceAll('!monitorName', 'First monitor')
        .replaceAll('!status', '✅UP')
        .replaceAll('!title', '200 - OK')
        .replaceAll('!pingMs', '420')
        .replaceAll('!checkStartedAt', this.now ?? '')
        .replaceAll('!checkResultLink', `https://${this.document.location.host}/m/1234/c/5678/logs`)
        .replaceAll('!message', 'Detailed message :)') ?? '',
  );

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

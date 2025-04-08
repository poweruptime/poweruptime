import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {DOCUMENT, DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatAutocomplete, MatOption} from '@angular/material/autocomplete';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {MarkdownComponent} from 'ngx-markdown';

import {MentionAutocompleteTrigger} from '@app/components';

@Component({
  template: `
    <div class="flex flex-col">
      <mat-form-field>
        <mat-label>{{ label() }}</mat-label>
        <textarea
          class="flex"
          [(mentionFilter)]="mentionFilter"
          [(ngModel)]="value"
          [matMentions]="auto"
          [disabled]="isDisabled()"
          style="width: 36rem"
          mentionTriggerChar=":"
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

      <div
        class="border-1 min-h-24 rounded-sm border border-dashed border-gray-400 p-4"
        style="margin-top: -0.5rem">
        @if (markdown()) {
          <markdown class="preview" [data]="preview()" emoji />
        } @else {
          <div class="preview" [innerHTML]="preview()"></div>
        }
      </div>
    </div>
  `,
  styles: `
    .preview {
      white-space: pre-wrap;
    }
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
    MatFormField,
    MatInput,
    MatLabel,
    CdkTextareaAutosize,
    MentionAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    FormsModule,
    MarkdownComponent,
  ],
})
export class NotificationMethodEditTemplate implements ControlValueAccessor {
  private readonly locale = inject(LOCALE_ID);
  private readonly dateFormat = new DatePipe(this.locale);
  private readonly document = inject(DOCUMENT);
  private readonly now = this.dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS z (Z)');

  markdown = input(false, {transform: booleanAttribute});

  label = input.required<string>();

  value = signal<string | null>('');
  isDisabled = signal(false);
  onChange?: (it: string | null) => void;

  mentionFilter = signal('');
  filteredItems = computed(() => {
    const filter = this.mentionFilter().trim().toLowerCase();
    return variables.filter((it) => it.trim().toLowerCase().includes(filter)).sort();
  });

  preview = computed(
    () =>
      this.value()
        ?.replaceAll(':monitorName', 'First monitor')
        .replaceAll(':status', '✅UP')
        .replaceAll(':title', '200 - OK')
        .replaceAll(':pingMs', '420')
        .replaceAll(':checkStartedAt', this.now ?? '')
        .replaceAll(':checkResultLink', `https://${this.document.location.host}/m/1234/c/5678/logs`)
        .replaceAll(':message', 'Detailed message :)') ?? '',
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

const variables = [
  'monitorName',
  'status',
  'title',
  'pingMs',
  'checkStartedAt',
  'message',
  'checkResultLink',
];

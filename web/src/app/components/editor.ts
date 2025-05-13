import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

import {EditorComponent, TINYMCE_SCRIPT_SRC} from '@tinymce/tinymce-angular';

import {ThemeService} from '../services/theme.service';

@Component({
  selector: 'pu-editor',
  template: `
    <editor [(ngModel)]="value" [init]="init()" [disabled]="isDisabled()" licenseKey="gpl" />
  `,
  providers: [
    {provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js'},
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Editor),
      multi: true,
    },
  ],
  imports: [EditorComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor implements ControlValueAccessor {
  private themeService = inject(ThemeService);

  placeholder = input<string>('');

  init = computed(() => {
    const currenTheme = this.themeService.currentTheme();
    return {
      selector: 'textarea',
      placeholder: this.placeholder(),
      height: 300,
      base_url: '/tinymce', // Root for resources
      suffix: '.min', // Suffix to use when loading resources
      plugins: 'advlist link image lists wordcount table searchreplace emoticons',
      toolbar:
        'undo redo | styles | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | emoticons',
      menubar: 'edit insert format table',
      skin: currenTheme === 'dark' ? 'oxide-dark' : 'oxide',
      content_css: currenTheme === 'dark' ? 'dark' : 'default',
    } satisfies EditorComponent['init'];
  });

  value = signal<string | null>(null);
  isDisabled = signal(false);
  onChange?: (it: string | null) => void;

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
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
  registerOnTouched(_: unknown): void {}
}

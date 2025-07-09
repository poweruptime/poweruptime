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

import {ThemeStore} from '@app/services';

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
  private themeService = inject(ThemeStore);

  placeholder = input<string>('');
  autocompleteVariables = input<string[]>();

  init = computed(() => {
    const currenTheme = this.themeService.currentTheme();
    const autocompleteVariables = this.autocompleteVariables();
    return {
      selector: 'textarea',
      placeholder: this.placeholder(),
      base_url: '/tinymce', // Root for resources
      suffix: '.min', // Suffix to use when loading resources
      plugins: 'advlist link image lists wordcount table searchreplace emoticons autoresize',
      toolbar:
        'undo redo | styles | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | emoticons',
      max_height: 700,
      menubar: 'edit insert format table',
      skin: currenTheme === 'dark' ? 'oxide-dark' : 'oxide',
      content_css: currenTheme === 'dark' ? 'dark' : 'default',
      setup: (editor) => {
        if (!autocompleteVariables) {
          return;
        }

        const onAction = (autocompleteApi: any, rng: Range, value: string) => {
          editor.selection.setRng(rng);
          editor.insertContent(value);
          autocompleteApi.hide();
        };

        const getMatchedChars = (pattern: string) =>
          autocompleteVariables.filter((item) => item.includes(pattern) && item !== pattern);

        editor.ui.registry.addAutocompleter('variables', {
          trigger: '!',
          minChars: 1,
          highlightOn: ['char_name'],
          columns: 1,
          onAction,
          fetch: (pattern) =>
            new Promise((resolve) => {
              const items = getMatchedChars(pattern).map((item) => ({
                type: 'cardmenuitem' as const,
                value: `!${item}`,
                label: item,
                items: [
                  {
                    type: 'cardcontainer' as const,
                    direction: 'vertical' as const,
                    items: [
                      {
                        type: 'cardtext' as const,
                        text: item,
                        name: 'char_name',
                      },
                    ],
                  },
                ],
              }));
              resolve(items);
            }),
        });
      },
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

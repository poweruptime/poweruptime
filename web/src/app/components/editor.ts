import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewEncapsulation,
  input,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';

import {Editor as NgxEditor, NgxEditorModule, Toolbar} from 'ngx-editor';

@Component({
  selector: 'pu-editor',
  template: `
    <div class="NgxEditor__Wrapper">
      <ngx-editor-menu [editor]="editor" [toolbar]="toolbar" />
      <ngx-editor
        [editor]="editor"
        [formControl]="control()"
        [placeholder]="placeholder()"
        outputFormat="html" />
    </div>
  `,
  imports: [NgxEditorModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor implements OnDestroy {
  control = input.required<FormControl<string | null | undefined>>();
  id = input<string>();
  placeholder = input<string>('');

  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code'],
    ['ordered_list', 'bullet_list'],
    // [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  editor = new NgxEditor();

  ngOnDestroy(): void {
    this.editor.destroy();
  }
}

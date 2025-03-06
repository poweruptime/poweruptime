import {ChangeDetectionStrategy, Component, ViewEncapsulation, input} from '@angular/core';

import {SanitizeHtmlPipe} from '@app/pipes';

@Component({
  template: `
    <div [innerHTML]="html() | sanitizeHtml"></div>
  `,
  selector: 'pu-shadow-render',
  imports: [SanitizeHtmlPipe],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowRender {
  html = input.required<string>();
}

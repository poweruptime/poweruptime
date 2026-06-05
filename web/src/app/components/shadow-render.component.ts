import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ViewEncapsulation,
  inject,
  input,
  resource,
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  template: `
    @if (safeHtml.value(); as safeHtml) {
      <div [innerHTML]="safeHtml"></div>
    }
  `,
  selector: 'pu-shadow-render',
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowRender {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly origin = inject(DOCUMENT).location.origin;

  html = input.required<string>();

  protected readonly safeHtml = resource({
    params: () => ({html: this.html()}),
    loader: async ({params, abortSignal}) => {
      const response = await fetch(`${this.origin}/bff/v1/sanitize/html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error('Failed to sanitize HTML');
      }

      const jsonResponse = await response.json();
      return this.sanitizer.bypassSecurityTrustHtml(jsonResponse.html);
    },
  });
}

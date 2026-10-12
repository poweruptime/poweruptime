import {httpResource} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  template: `
    @if (safeHtml(); as safeHtml) {
      <div class="prose dark:prose-invert max-w-none" [innerHTML]="safeHtml"></div>
    }
  `,
  selector: 'pu-shadow-render',
  host: {class: 'block'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowRender {
  private readonly sanitizer = inject(DomSanitizer);

  html = input.required<string>();

  private readonly sanitizedHtml = httpResource<{html: string}>(() => {
    const html = this.html();
    return html
      ? {
          url: '/bff/v1/sanitize/html',
          method: 'POST',
          body: {html},
          // Sanitization is a read: allow this POST response to be transferred for hydration.
          transferCache: true,
        }
      : undefined;
  });

  protected readonly safeHtml = computed(() => {
    if (!this.sanitizedHtml.hasValue()) {
      return undefined;
    }

    return this.sanitizer.bypassSecurityTrustHtml(this.sanitizedHtml.value().html);
  });
}

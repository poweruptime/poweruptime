import {Injectable} from '@angular/core';

import {ExternalLink, LinkRenderer, isExternalLinkObject} from 'ngx-transloco-markup';

@Injectable()
export class CustomLinkRenderer extends LinkRenderer<string> {
  public supports(link: unknown): link is string {
    return typeof link === 'string';
  }

  public render(link: string, targetElement: HTMLAnchorElement): void {
    targetElement.style.textDecorationLine = 'underline';
    targetElement.href = link;
    targetElement.target = '_blank';
  }
}

/**
 * Link renderer that supports rendering of `ExternalLink` objects.
 */
@Injectable()
export class CustomExternalLinkObjectLinkRenderer extends LinkRenderer<ExternalLink> {
  public supports(link: unknown): link is ExternalLink {
    return isExternalLinkObject(link);
  }

  public render(link: ExternalLink, targetElement: HTMLAnchorElement): void {
    targetElement.style.textDecorationLine = 'underline';

    targetElement.href = link.url;
    if (typeof link.target === 'string') {
      targetElement.target = link.target;
    }
  }
}

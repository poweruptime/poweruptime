import {ChangeDetectionStrategy, Component} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideChevronUp} from '@ng-icons/lucide';
import {HlmIcon} from '@spartan-ng/helm/icon';
import {classes} from '@spartan-ng/helm/utils';

@Component({
  selector: 'hlm-select-scroll-up',
  imports: [NgIcon, HlmIcon],
  providers: [provideIcons({lucideChevronUp})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-icon class="ml-2" hlm size="sm" name="lucideChevronUp" />
  `,
})
export class HlmSelectScrollUp {
  constructor() {
    classes(() => 'flex cursor-default items-center justify-center py-1');
  }
}

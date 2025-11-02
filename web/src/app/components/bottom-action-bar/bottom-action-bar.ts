import {ChangeDetectionStrategy, Component} from '@angular/core';

import {OutsideAboutButton} from './about-button';
import {OutsideLanguageSwitch} from './language-switch';
import {OutsideThemeSwitch} from './theme-switch';

@Component({
  template: `
    <div class="fixed right-4 bottom-4">
      <div class="inline-flex gap-4">
        <pu-outside-theme-switch />
        <pu-outside-language-switch />
        <pu-outside-about-button />
      </div>
    </div>
  `,
  selector: 'pu-bottom-action-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OutsideAboutButton, OutsideLanguageSwitch, OutsideThemeSwitch],
})
export class BottomActionBar {}

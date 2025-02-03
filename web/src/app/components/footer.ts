import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  template: `
    <div class="flex">Footer</div>
  `,
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {}

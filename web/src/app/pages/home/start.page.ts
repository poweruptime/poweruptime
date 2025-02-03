import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  template: `
    Start page
  `,
  styles: ``,
  selector: 'start-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class StartPage {}

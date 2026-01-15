import {ChangeDetectionStrategy, Component} from '@angular/core';

import {StatusPageList} from '@app/components/status-page';

@Component({
  template: `
    <pu-status-page-list />
  `,
  selector: 'pu-status-pages-page',
  imports: [StatusPageList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPagesPage {}

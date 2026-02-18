import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmAccordionImports} from '@spartan-ng/helm/accordion';
import {HlmAlertImports} from '@spartan-ng/helm/alert';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {ShadowRender} from '@app/components';
import {MonitorStatus} from '@app/components/monitor';
import {RelativeTimePipe, RelativeTimeWithTooltip} from '@app/pipes';
import {NotificationDetailStore, SubNotificationsStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @if (notificationDetailStore.notification(); as notification) {
        <div>
          <button (click)="goBack()" hlmBtn variant="ghost" type="button">
            <ng-icon hlm size="sm" name="bootstrapArrowLeft" />
            <span>{{ notification.monitor.name }}</span>
          </button>
        </div>
        <div class="flex flex-wrap items-end gap-2 text-2xl">
          <pu-monitor-status [status]="notification.status" />
          <h1>{{ notification.title }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-2 text-sm">
            <ng-icon name="bootstrapClock" />
            <pu-relative-time [value]="notification.createdAt" format="yyyy.MM.dd HH:mm:ss" />
          </span>

          <a
            [routerLink]="'../../c/' + notification.checkResultId + '/logs'"
            hlmBtn
            variant="ghost">
            {{ 'notification.detail.openCheckResult' | transloco }}
            <ng-icon hlm size="sm" name="bootstrapBoxArrowUpRight" />
          </a>
        </div>

        <hr />

        @if (subNotificationsStore.entities().length > 0) {
          <div class="grid gap-2">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-2xl">Notification Deliveries</h2>
              @let _expandAll = expandAll();
              <button
                [variant]="_expandAll ? 'default' : 'outline'"
                [hlmTooltip]="tooltip"
                (click)="expandAll.set(!_expandAll)"
                hlmBtn
                size="icon-sm"
                type="button">
                <ng-icon hlm size="sm" name="bootstrapArrowsExpand" />
              </button>
              <ng-template #tooltip>
                <span>
                  @if (_expandAll) {
                    Hide all
                  } @else {
                    Show all
                  }
                </span>
              </ng-template>
            </div>

            <hlm-accordion class="pb-4" type="multiple">
              @for (subNotification of subNotificationsStore.entities(); track subNotification.id) {
                <hlm-accordion-item [isOpened]="_expandAll">
                  <h3 class="contents">
                    <button class="hover:no-underline" hlmAccordionTrigger type="button">
                      <div class="flex flex-col gap-2">
                        <span>{{ subNotification.method.name }}</span>
                        @if (subNotification.error) {
                          <span hlmBadge variant="destructive">
                            {{ 'general.error' | transloco }}
                          </span>
                        } @else {
                          <span class="text-muted-foreground text-sm font-light">
                            Sent {{ subNotification.sentAt | relativeTime }}
                          </span>
                        }
                      </div>
                      <ng-icon name="lucideChevronDown" hlm hlmAccIcon />
                    </button>
                  </h3>
                  <hlm-accordion-content>
                    <pu-shadow-render [html]="subNotification.title" />

                    @if (subNotification.message; as message) {
                      <pu-shadow-render [html]="message" />
                    }

                    @if (subNotification.error; as error) {
                      <div hlmAlert variant="destructive">
                        <ng-icon hlm hlmAlertIcon name="lucideCircleAlert" />
                        <h4 hlmAlertTitle>{{ 'general.error' | transloco }}</h4>
                        <p hlmAlertDescription>{{ error }}</p>
                      </div>
                    }
                  </hlm-accordion-content>
                </hlm-accordion-item>
              }
            </hlm-accordion>
          </div>
        } @else {
          <div hlmEmpty>
            <div hlmEmptyHeader>
              <div hlmEmptyMedia variant="icon">
                <ng-icon name="bootstrapBell" />
              </div>
              <div hlmEmptyTitle>Stay in the loop — set up notifications</div>
              <div hlmEmptyDescription>
                This monitor doesn’t have any notification methods linked yet. Add one now to get
                alerts when something important happens.
              </div>
            </div>
            <div hlmEmptyContent>
              <a hlmBtn routerLink="/t/{{ notification.team.id }}/notification-methods">
                Create or edit notification methods
              </a>
            </div>
          </div>
        }
      }
    </div>
  `,
  selector: 'monitor-check-result-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MonitorStatus,
    RelativeTimeWithTooltip,
    RelativeTimePipe,
    ShadowRender,
    RouterLink,
    FormsModule,
    TranslocoPipe,
    HlmButtonImports,
    HlmEmptyImports,
    HlmIconImports,
    HlmAccordionImports,
    HlmBadgeImports,
    HlmTooltipImports,
    HlmAlertImports,
  ],
})
export class MonitorNotificationDetailPage {
  protected readonly notificationDetailStore = inject(NotificationDetailStore);
  protected readonly subNotificationsStore = inject(SubNotificationsStore);

  readonly notificationId = input<string>();

  protected readonly expandAll = linkedQueryParam('expand', {
    parse: paramToBoolean({defaultValue: false}),
    stringify: (value) => (!value ? null : value),
    queryParamsHandling: '',
    skipLocationChange: true,
  });

  constructor() {
    this.notificationDetailStore.loadById(this.notificationId);
    this.subNotificationsStore.load(this.notificationId);
  }

  protected goBack() {
    history.back();
  }
}

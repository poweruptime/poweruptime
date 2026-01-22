import {DatePipe, KeyValuePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {format} from '@std/fmt/duration';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';
import {RepeatPipe} from 'ngxtension/repeat-pipe';

import {CopyIconButton} from '@app/components';
import {CheckResultLogEntry, MonitorStatus} from '@app/components/monitor';
import {CheckResultDetailStore, CheckResultLogEntriesStore} from '@app/services';

@Component({
  template: `
    <div class="grid gap-14">
      @if (checkResultDetailStore.isPending()) {
        <div class="flex animate-pulse flex-col gap-4">
          <hlm-skeleton class="h-10 w-32" />
          <hlm-skeleton class="h-12 w-96" />
          <hlm-skeleton class="h-24 w-full" />
        </div>
      } @else {
        @if (checkResultDetailStore.checkResult(); as checkResult) {
          <div class="grid gap-6">
            <div>
              <button (click)="goBack()" hlmBtn type="button">
                <ng-icon hlm size="sm" name="bootstrapArrowLeft" />
                <span>{{ 'notFound.back' | transloco }}</span>
              </button>
            </div>
            <div class="flex flex-wrap gap-2 text-2xl">
              <pu-monitor-status [status]="checkResult.status" />
              <h1>{{ checkResult.title }}</h1>
              <span class="text-gray-400">#{{ checkResult.id }}</span>
            </div>

            <section hlmCard>
              <div class="flex gap-10" hlmCardContent>
                @if (checkResult.pingMs; as pingMs) {
                  <div class="flex flex-col gap-2">
                    <h3 class="text-gray-400">{{ 'general.ping' | transloco }}</h3>
                    <span class="text-lg font-bold">{{ pingMs }}ms</span>
                  </div>
                }

                @let logEntries = checkResultLogEntriesStore.entities();
                @if (logEntries.length > 1) {
                  <div class="flex flex-col gap-2">
                    <h3 class="text-gray-400">{{ 'general.totalDuration' | transloco }}</h3>
                    <span class="text-lg font-bold">
                      {{ totalDuration() }}
                    </span>
                  </div>
                }

                <div class="flex flex-col gap-2">
                  <h3 class="text-gray-400">{{ 'checkResult.details.startedAt' | transloco }}</h3>
                  <span class="text-lg font-bold">
                    {{ checkResult.createdAt | date: 'HH:mm:ss yyyy.MM.dd' }}
                  </span>
                </div>
              </div>
            </section>
          </div>

          @if (checkResult.message; as message) {
            <section hlmCard>
              <div class="flex items-start justify-between gap-2" hlmCardContent>
                <pre class="flex-1 whitespace-pre-wrap">{{ message }}</pre>
                <pu-copy-icon-button [content]="message" matTooltipPosition="left" />
              </div>
            </section>
          }
        }
      }

      @if (checkResultDetailStore.isPending() || checkResultLogEntriesStore.isPending()) {
        <div class="flex animate-pulse flex-col gap-4">
          @for (i of 5 | repeat; track i) {
            <hlm-skeleton class="h-10 w-full" />
          }
        </div>
      } @else {
        @if (checkResultLogEntriesStore.entities().length === 0) {
          <section hlmCard>
            <div class="flex flex-col items-center gap-2" hlmCardContent>
              <ng-icon size="24" name="bootstrapCalendarX" />
              <code>{{ 'checkResult.details.expired' | transloco }}</code>
            </div>
          </section>
        } @else {
          <div class="mt-4 flex flex-col gap-4 space-y-1">
            <div class="flex items-center justify-between">
              <h2 class="ps-2 text-xl">{{ 'general.logs' | transloco }}</h2>

              <label class="inline-flex items-center" hlmLabel for="showTimestamps">
                {{ 'checkResult.details.showTimestamps' | transloco }}
                <hlm-switch class="mr-2" id="showTimestamps" [(checked)]="showTimestamps" />
              </label>
            </div>

            <section hlmCard>
              <div hlmCardHeader>
                <h3 hlmCardTitle>{{ 'general.setup' | transloco }}</h3>
              </div>
              <div hlmCardContent>
                @for (logEntry of checkResultLogEntriesStore.setup(); track logEntry.id) {
                  <pu-check-result-log-entry
                    [logEntry]="logEntry"
                    [showTimestamps]="showTimestamps()" />
                }
              </div>
            </section>
            <section hlmCard>
              <div hlmCardHeader>
                <h3 hlmCardTitle>{{ 'checkResult.details.check' | transloco }}</h3>
              </div>
              <div hlmCardContent>
                @for (logEntry of checkResultLogEntriesStore.check(); track logEntry.id) {
                  <pu-check-result-log-entry
                    [logEntry]="logEntry"
                    [showTimestamps]="showTimestamps()" />
                }
              </div>
            </section>
            <section hlmCard>
              <div hlmCardHeader>
                <h3 hlmCardTitle>{{ 'checkResult.details.statusUpdate' | transloco }}</h3>
              </div>
              <div hlmCardContent>
                @for (logEntry of checkResultLogEntriesStore.statusUpdate(); track logEntry.id) {
                  <pu-check-result-log-entry
                    [logEntry]="logEntry"
                    [showTimestamps]="showTimestamps()" />
                }
              </div>
            </section>
            <section hlmCard>
              <div hlmCardHeader>
                <h3 hlmCardTitle>{{ 'general.notifications' | transloco }}</h3>
              </div>
              <div hlmCardContent>
                @for (logEntry of checkResultLogEntriesStore.notifications(); track logEntry.id) {
                  @if (logEntry.properties?.['notificationId']; as notificationId) {
                    <a [routerLink]="'../../../n/' + notificationId">
                      <pu-check-result-log-entry
                        [logEntry]="logEntry"
                        [showTimestamps]="showTimestamps()" />
                    </a>
                  } @else {
                    <pu-check-result-log-entry
                      [logEntry]="logEntry"
                      [showTimestamps]="showTimestamps()" />
                  }
                } @empty {
                  <pu-check-result-log-entry
                    [logEntry]="{
                      id: '1234',
                      stage: 'NOTIFICATION',
                      level: 'INFO',
                      message: 'No notifications queued.',
                      createdAt: '',
                    }"
                    [showTimestamps]="showTimestamps()" />
                }
                <div class="mt-4 grid grid-cols-2 gap-4">
                  @for (
                    item of checkResultLogEntriesStore.notificationsGrouped() | keyvalue;
                    track item.key
                  ) {
                    <section hlmCard>
                      <div hlmCardContent>
                        @for (logEntry of item.value; track logEntry.id) {
                          <pu-check-result-log-entry
                            [logEntry]="logEntry"
                            [showTimestamps]="showTimestamps()"
                            disableStartTimestamp />
                        }
                      </div>
                    </section>
                  }
                </div>
              </div>
            </section>
          </div>
        }
      }
    </div>
  `,
  selector: 'monitor-check-result-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    RouterLink,
    FormsModule,
    CheckResultLogEntry,
    KeyValuePipe,
    CopyIconButton,
    RepeatPipe,
    TranslocoPipe,
    DatePipe,
    MonitorStatus,
    HlmSkeletonImports,
    HlmCardImports,
    HlmButtonImports,
    HlmIconImports,
    HlmLabelImports,
    HlmSwitchImports,
  ],
})
export class MonitorCheckResultDetailPage {
  readonly checkResultDetailStore = inject(CheckResultDetailStore);
  readonly checkResultLogEntriesStore = inject(CheckResultLogEntriesStore);

  readonly checkResultId = input<string>();

  showTimestamps = injectLocalStorage('pu_cr_show_timestamps', {defaultValue: false});

  constructor() {
    this.checkResultDetailStore.loadById(this.checkResultId);
    this.checkResultLogEntriesStore.load(this.checkResultId);
  }

  readonly totalDuration = computed(() => {
    const logEntries = this.checkResultLogEntriesStore.entities();
    if (logEntries.length < 2) {
      return 'Loading';
    }

    return format(
      new Date(logEntries[logEntries.length - 1].createdAt).getTime() -
        new Date(logEntries[0].createdAt).getTime(),
      {ignoreZero: true},
    );
  });

  protected goBack() {
    history.back();
  }
}

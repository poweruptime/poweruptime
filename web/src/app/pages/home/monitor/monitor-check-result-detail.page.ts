import {KeyValuePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatAnchor, MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {format} from '@std/fmt/duration';
import {cl_copy} from 'dfts-helper';
import {BiComponent} from 'dfx-bootstrap-icons';
import {toast} from 'ngx-sonner';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {Placeholder} from '@app/components';
import {CheckResultLogEntry} from '@app/components/monitor';
import {MonitorStatusBackground} from '@app/directives';
import {CheckResultDetailStore, CheckResultLogEntriesStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @if (checkResultDetailStore.isPending() || checkResultLogEntriesStore.isPending()) {
        <div class="flex animate-pulse flex-col gap-4">
          <pu-placeholder class="h-10 w-32" />
          <pu-placeholder class="h-12 w-96" />
          <pu-placeholder class="h-24 w-full" />
          <pu-placeholder class="h-10 w-full" />
          <pu-placeholder class="h-10 w-full" />
          <pu-placeholder class="h-10 w-full" />
          <pu-placeholder class="h-10 w-full" />
          <pu-placeholder class="h-10 w-full" />
        </div>
      } @else {
        @if (checkResultDetailStore.checkResult(); as checkResult) {
          <div>
            <a mat-stroked-button routerLink="../../../" queryParamsHandling="merge">
              <bi class="me-1" name="arrow-left" />
              <span>{{ checkResult.monitor.name }}</span>
            </a>
          </div>
          <div class="flex flex-wrap gap-2 text-2xl">
            <strong
              class="rounded-lg px-2 py-1 text-lg"
              [monitor-status-background]="checkResult.status">
              {{ checkResult.status }}
            </strong>
            <h1>{{ checkResult.title }}</h1>
            <span class="text-gray-400">#{{ checkResult.id }}</span>
          </div>

          @if (checkResult.message; as message) {
            <mat-card appearance="outlined">
              <mat-card-content>
                <div class="flex items-start justify-between gap-2">
                  <pre class="flex-1 whitespace-pre-wrap">{{ message }}</pre>
                  <button
                    (click)="copyMessage(message)"
                    mat-icon-button
                    matTooltip="Copy"
                    matTooltipPosition="left">
                    <bi name="copy" />
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }

          <mat-card appearance="outlined">
            <mat-card-content>
              <div class="flex gap-10 px-2">
                <div class="flex flex-col gap-2">
                  <h3 class="text-gray-400">Status</h3>
                  <span class="text-lg font-bold">{{ checkResult.status }}</span>
                </div>

                <div class="flex flex-col gap-2">
                  <h3 class="text-gray-400">Ping</h3>
                  <span class="text-lg font-bold">{{ checkResult.pingMs }}ms</span>
                </div>

                @let logEntries = checkResultLogEntriesStore.entities();
                @if (logEntries.length > 1) {
                  <div class="flex flex-col gap-2">
                    <h3 class="text-gray-400">Total Duration</h3>
                    <span class="text-lg font-bold">
                      {{ totalDuration() }}
                    </span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        @if (checkResultLogEntriesStore.entities().length === 0) {
          <mat-card>
            <mat-card-content>
              <div class="flex flex-col items-center gap-2">
                <bi size="24" name="calendar-x" />
                <code>The logs for this check have expired and are no longer available.</code>
              </div>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="mt-4 flex flex-col gap-4 space-y-1">
            <div class="flex items-center justify-between">
              <h2 class="ps-2 text-xl">Logs</h2>
              <mat-slide-toggle [(ngModel)]="showTimestamps">Show timestamps</mat-slide-toggle>
            </div>

            <mat-card appearance="outlined">
              <mat-card-content>
                <h3 class="mb-2 ps-2 text-lg">Setup</h3>
                @for (logEntry of checkResultLogEntriesStore.setup(); track logEntry.id) {
                  <pu-check-result-log-entry
                    [logEntry]="logEntry"
                    [showTimestamps]="showTimestamps()" />
                }
              </mat-card-content>
            </mat-card>

            <mat-card appearance="outlined">
              <mat-card-content>
                <h3 class="mb-2 ps-2 text-lg">Check</h3>
                @for (logEntry of checkResultLogEntriesStore.check(); track logEntry.id) {
                  <pu-check-result-log-entry
                    [logEntry]="logEntry"
                    [showTimestamps]="showTimestamps()" />
                }
              </mat-card-content>
            </mat-card>

            <mat-card appearance="outlined">
              <mat-card-content>
                <h3 class="mb-2 ps-2 text-lg">Status update</h3>
                @for (logEntry of checkResultLogEntriesStore.statusUpdate(); track logEntry.id) {
                  <pu-check-result-log-entry
                    [logEntry]="logEntry"
                    [showTimestamps]="showTimestamps()" />
                }
              </mat-card-content>
            </mat-card>

            <mat-card appearance="outlined">
              <mat-card-content>
                <h3 class="mb-2 ps-2 text-lg">Notifications</h3>
                @for (logEntry of checkResultLogEntriesStore.notifications(); track logEntry.id) {
                  <pu-check-result-log-entry
                    [logEntry]="logEntry"
                    [showTimestamps]="showTimestamps()" />
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
                    <mat-card appearance="outlined">
                      <mat-card-content>
                        @for (logEntry of item.value; track logEntry.id) {
                          <pu-check-result-log-entry
                            [logEntry]="logEntry"
                            [showTimestamps]="showTimestamps()"
                            disableStartTimestamp />
                        }
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        }
      }
    </div>
  `,
  selector: 'monitor-check-result-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BiComponent,
    MatAnchor,
    RouterLink,
    MonitorStatusBackground,
    MatCard,
    MatCardContent,
    MatSlideToggle,
    FormsModule,
    CheckResultLogEntry,
    KeyValuePipe,
    Placeholder,
    MatIconButton,
    MatTooltip,
  ],
})
export class MonitorCheckResultDetailPage {
  readonly checkResultDetailStore = inject(CheckResultDetailStore);
  readonly checkResultLogEntriesStore = inject(CheckResultLogEntriesStore);

  readonly checkResultId = input<string>();

  readonly showTimestamps = injectLocalStorage('pu_cr_show_timestamps', {defaultValue: false});

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

  copyMessage(message: string) {
    cl_copy(message);
    toast.success('Message copied!');
  }
}

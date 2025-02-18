import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {CdkPortal} from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';

import {Cmdk} from '@app/components/cmdk/cmdk';

@Component({
  selector: 'pu-cmdk-overlay',
  imports: [Cmdk, CdkPortal, MatButton, TranslocoPipe, MatTooltip],
  template: `
    @if (hasUsedShortcut() < 5) {
      <button
        class="secondary-button"
        [matTooltip]="'cmdk.toggle' | transloco"
        [attr.aria-label]="'cmdk.toggle' | transloco"
        (click)="open()"
        mat-flat-button>
        ⌘ K
      </button>
    }
    <ng-template cdkPortal>
      <pu-cmdk [(pages)]="pages" (close)="close()" />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmdkOverlay implements OnInit, OnDestroy {
  overlay = inject(Overlay);

  hasUsedShortcut = model.required<number>();

  isOpen = signal(false);
  abort = new AbortController();
  portal = viewChild.required(CdkPortal);
  overlayRef?: OverlayRef;

  pages = signal(['home']);

  ngOnInit(): void {
    document.addEventListener('keydown', (ev) => this.listener(ev), {
      signal: this.abort.signal,
    });
  }

  ngOnDestroy(): void {
    this.abort.abort();
  }

  open(): void {
    this.pages.set(['home']);
    this.isOpen.set(true);

    const config = new OverlayConfig({
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      width: '640px',
      hasBackdrop: true,
    });

    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(this.portal());
    this.overlayRef.backdropClick().subscribe(() => this.close());
  }

  close(): void {
    this.isOpen.set(false);
    this.overlayRef?.detach();
  }

  listener(e: KeyboardEvent): void {
    if (e.key === 'k' && (e.metaKey || e.altKey)) {
      if (this.hasUsedShortcut() < 5) {
        this.hasUsedShortcut.set(this.hasUsedShortcut() + 1);
      }
      e.preventDefault();
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }

      return;
    }

    if (e.key === 'm' && e.altKey) {
      if (!this.isOpen()) {
        this.open();
      }

      this.pages.set(['home', 'monitors']);

      return;
    }

    if (e.key === 't' && e.altKey) {
      if (!this.isOpen()) {
        this.open();
      }

      this.pages.set(['home', 'teams']);

      return;
    }
  }
}

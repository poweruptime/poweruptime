import {DOCUMENT} from '@angular/common';
import {Injectable, Injector, OnDestroy, inject, runInInjectionContext} from '@angular/core';

import {Subject, share} from 'rxjs';

import {assertInjector} from 'ngxtension/assert-injector';

@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutListener implements OnDestroy {
  private abortController = new AbortController();

  private document = inject(DOCUMENT);

  private keydown$ = new Subject<KeyboardEvent>();
  shortcut$ = this.keydown$.pipe(share());

  constructor() {
    this.document.addEventListener('keydown', (event) => this.keydown$.next(event), {
      signal: this.abortController.signal,
    });
  }

  ngOnDestroy(): void {
    this.abortController.abort('ngOnDestroy');
  }
}

export function injectKeyboardShortcut(keys: 'CTRL'[][], {injector}: {injector?: Injector}) {
  injector = assertInjector(injectKeyboardShortcut, injector);
  return runInInjectionContext(injector, () => {});
}

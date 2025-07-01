import {isPlatformBrowser, isPlatformServer} from '@angular/common';
import {PLATFORM_ID, Provider, StateKey, TransferState, inject, makeStateKey} from '@angular/core';

import {NGXTENSION_LOCAL_STORAGE} from 'ngxtension/inject-local-storage';

const LOCAL_STORAGE_KEY: StateKey<{[k: string]: string}> = makeStateKey<{[k: string]: string}>(
  'LOCAL_STORAGE',
);

export function transferableLocalStorageFactory(): Storage {
  const platformId = inject(PLATFORM_ID);
  const transferState = inject(TransferState);

  if (isPlatformServer(platformId)) {
    const store: {[k: string]: string} = {};
    const updateTransfer = () => transferState.set(LOCAL_STORAGE_KEY, {...store});

    return {
      get length(): number {
        return Object.keys(store).length;
      },
      clear(): void {
        Object.keys(store).forEach((k) => delete store[k]);
        updateTransfer();
      },
      getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      key(index: number): string | null {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
      removeItem(key: string): void {
        delete store[key];
        updateTransfer();
      },
      setItem(key: string, value: string): void {
        store[key] = String(value);
        updateTransfer();
      },
    };
  }

  // --- BROWSER: replay TransferState into real localStorage ---
  if (isPlatformBrowser(platformId)) {
    const saved = transferState.get(LOCAL_STORAGE_KEY, null as any);
    if (saved) {
      Object.keys(saved).forEach((k) => window.localStorage.setItem(k, saved[k]));
      transferState.remove(LOCAL_STORAGE_KEY);
    }
    return window.localStorage;
  }

  // --- FALLBACK: no‐op storage ---
  return {
    get length(): number {
      return 0;
    },
    clear(): void {},
    getItem(): string | null {
      return null;
    },
    key(): string | null {
      return null;
    },
    removeItem(): void {},
    setItem(): void {},
  };
}

export function provideTransferableLocalStorageImpl(): Provider {
  return {
    provide: NGXTENSION_LOCAL_STORAGE,
    useFactory: transferableLocalStorageFactory,
    deps: [PLATFORM_ID, TransferState],
  };
}

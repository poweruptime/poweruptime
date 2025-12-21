import {ChangeDetectionStrategy, Component, booleanAttribute, computed, input} from '@angular/core';

import {type BooleanInput} from '@angular/cdk/coercion';

import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {hlm} from '@spartan-ng/helm/utils';
import type {ClassValue} from 'clsx';

@Component({
  selector: 'hlm-sidebar-menu-skeleton,div[hlmSidebarMenuSkeleton]',
  imports: [HlmSkeletonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sidebar-menu-skeleton',
    'data-sidebar': 'menu-skeleton',
    '[class]': '_computedClass()',
    '[style.--skeleton-width]': '_width',
  },
  template: `
    @if (showIcon()) {
      <hlm-skeleton class="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />
    } @else {
      <hlm-skeleton
        class="h-4 max-w-[var(--skeleton-width)] flex-1"
        data-sidebar="menu-skeleton-text" />
    }
  `,
})
export class HlmSidebarMenuSkeleton {
  public readonly showIcon = input<boolean, BooleanInput>(false, {transform: booleanAttribute});
  public readonly userClass = input<ClassValue>('', {alias: 'class'});
  protected readonly _computedClass = computed(() =>
    hlm('flex h-8 items-center gap-2 rounded-md px-2', this.userClass()),
  );
  protected readonly _width = `${Math.floor(Math.random() * 40) + 50}%`;
}

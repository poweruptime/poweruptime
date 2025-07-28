import {Directive, booleanAttribute, computed, inject, input} from '@angular/core';

import {ThemeService} from '@angularui/theme';

import {BackendType} from '../api';

@Directive({
  standalone: true,
  selector: '[pu-tag]',
  host: {
    class:
      'mat-chip-tag inline-flex items-center rounded-md px-2 py-1 font-medium ring-1 ring-inset transform transition duration-150 ease-in-out',
    '[class.hover:scale-105]': 'clickable()',

    '[style.--mat-chip-label-text-color]': 'matChipLabelTextColor()',
    '[style.--mat-chip-outline-color]': 'matChipOutlineColor()',

    '[class.!bg-red-50]': 'variant() === "RED"',
    '[class.text-red-700]': 'variant() === "RED"',
    '[class.ring-red-600/10]': 'variant() === "RED"',
    '[class.dark:!bg-red-950]': 'variant() === "RED"',
    '[class.dark:text-red-300]': 'variant() === "RED"',
    '[class.dark:ring-red-300/20]': 'variant() === "RED"',

    '[class.!bg-blue-50]': 'variant() === "BLUE"',
    '[class.text-blue-700]': 'variant() === "BLUE"',
    '[class.ring-blue-600/10]': 'variant() === "BLUE"',
    '[class.dark:!bg-blue-950]': 'variant() === "BLUE"',
    '[class.dark:text-blue-300]': 'variant() === "BLUE"',
    '[class.dark:ring-blue-300/20]': 'variant() === "BLUE"',

    '[class.!bg-green-50]': 'variant() === "GREEN"',
    '[class.text-green-700]': 'variant() === "GREEN"',
    '[class.ring-green-600/10]': 'variant() === "GREEN"',
    '[class.dark:!bg-green-950]': 'variant() === "GREEN"',
    '[class.dark:text-green-300]': 'variant() === "GREEN"',
    '[class.dark:ring-green-300/20]': 'variant() === "GREEN"',

    '[class.!bg-pink-50]': 'variant() === "PINK"',
    '[class.text-pink-700]': 'variant() === "PINK"',
    '[class.ring-pink-600/10]': 'variant() === "PINK"',
    '[class.dark:!bg-pink-950]': 'variant() === "PINK"',
    '[class.dark:text-pink-300]': 'variant() === "PINK"',
    '[class.dark:ring-pink-300/20]': 'variant() === "PINK"',

    '[class.!bg-yellow-50]': 'variant() === "YELLOW"',
    '[class.text-yellow-600]': 'variant() === "YELLOW"',
    '[class.ring-yellow-700/10]': 'variant() === "YELLOW"',
    '[class.dark:!bg-yellow-950]': 'variant() === "YELLOW"',
    '[class.dark:text-yellow-300]': 'variant() === "YELLOW"',
    '[class.dark:ring-yellow-300/20]': 'variant() === "YELLOW"',

    '[class.text-neutral-900]': 'variant() === "GHOST"',
    '[class.ring-neutral-600/10]': 'variant() === "GHOST"',
    '[class.dark:text-neutral-100]': 'variant() === "GHOST"',
    '[class.dark:ring-neutral-300/20]': 'variant() === "GHOST"',
  },
})
export class Tag {
  private readonly themeService = inject(ThemeService);

  variant = input.required<BackendType['TagDto']['variant'] | 'GHOST'>({
    alias: 'pu-tag',
  });
  clickable = input(false, {transform: booleanAttribute});

  matChipLabelTextColor = computed(() => {
    const theme = this.themeService.resolvedTheme();
    switch (this.variant()) {
      case 'GHOST':
        return getColorByTheme(theme, 'oklch(14.5% 0 0)', 'oklch(97% 0 0)');
      case 'RED':
        return getColorByTheme(theme, 'oklch(50.5% 0.213 27.518)', 'oklch(80.8% 0.114 19.571)');
      case 'BLUE':
        return getColorByTheme(theme, 'oklch(48.8% 0.243 264.376)', 'oklch(80.9% 0.105 251.813)');
      case 'GREEN':
        return getColorByTheme(theme, 'oklch(52.7% 0.154 150.069)', 'oklch(87.1% 0.15 154.449)');
      case 'PINK':
        return getColorByTheme(theme, 'oklch(52.5% 0.223 3.958)', 'oklch(82.3% 0.12 346.018)');
      case 'YELLOW':
        return getColorByTheme(theme, 'oklch(55.4% 0.135 66.442)', 'oklch(90.5% 0.182 98.111)');
    }
  });

  matChipOutlineColor = computed(() => {
    const theme = this.themeService.resolvedTheme();
    switch (this.variant()) {
      case 'GHOST':
        return getColorByTheme(theme, 'oklch(14.5% 0 0)', 'oklch(97% 0 0)');
      case 'RED':
        return getColorByTheme(theme, 'oklch(57.7% 0.245 27.325)', 'oklch(80.8% 0.114 19.571)');
      case 'BLUE':
        return getColorByTheme(theme, 'oklch(54.6% 0.245 262.881)', 'oklch(80.9% 0.105 251.813)');
      case 'GREEN':
        return getColorByTheme(theme, 'oklch(62.7% 0.194 149.214)', 'oklch(87.1% 0.15 154.449)');
      case 'PINK':
        return getColorByTheme(theme, 'oklch(59.2% 0.249 0.584)', 'oklch(82.3% 0.12 346.018)');
      case 'YELLOW':
        return getColorByTheme(theme, 'oklch(68.1% 0.162 75.834)', 'oklch(90.5% 0.182 98.111)');
    }
  });
}

function getColorByTheme(theme: 'dark' | 'light', lightColor: string, darkColor: string) {
  return theme === 'light' ? lightColor : darkColor;
}

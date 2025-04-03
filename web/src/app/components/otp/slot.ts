import {Component, Input} from '@angular/core';

@Component({
  selector: 'pu-otp-fake-dash',
  template: `
    <div class="flex w-10 items-center justify-center">
      <div class="h-1 w-3 rounded-full bg-black/75 dark:bg-white/75"></div>
    </div>
  `,
})
export class FakeDash {}

@Component({
  selector: 'pu-otp-fake-caret',
  template: `
    <div
      class="animate-caret-blink pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="h-8 w-[2px] bg-black/75 dark:bg-white/75"></div>
    </div>
  `,
  styles: ``,
})
export class FakeCaret {}

@Component({
  template: `
    @if (char) {
      <div>{{ char }}</div>
    } @else {
      {{ ' ' }}
    }
    @if (hasFakeCaret) {
      <pu-otp-fake-caret />
    }
  `,
  host: {
    class:
      'relative w-10 h-14 text-[2rem] flex items-center justify-center transition-all duration-300 border-y border-r group-hover:border-accent-foreground/20 group-focus-within:border-accent-foreground/20 outline outline-0 outline-accent-foreground/20',
    '[class.border-l]': 'first',
    '[class.rounded-l-md]': 'first',
    '[class.rounded-r-md]': 'last',
  },
  selector: 'pu-otp-slot',
  imports: [FakeCaret],
})
export class Slot {
  @Input() isActive = false;
  @Input() char: string | null = null;
  @Input() placeholderChar: string | null = null;
  @Input() hasFakeCaret = false;
  @Input() first = false;
  @Input() last = false;
}

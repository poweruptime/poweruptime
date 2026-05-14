import {isPlatformServer} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
} from '@angular/core';

import {ThemeService} from 'dfx-theme';

interface Dot {
  x: number;
  y: number;
  baseOpacity: number;
  currentOpacity: number;
}

@Component({
  selector: 'pu-dot-background',
  template: `
    <canvas
      class="absolute inset-0 h-full w-full"
      #canvas
      [style.background]="theme() === 'dark' ? 'hsl(240 5% 9%)' : 'hsl(0 0% 100%)'"></canvas>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DotBackground implements AfterViewInit, OnDestroy {
  protected readonly theme = inject(ThemeService).resolvedTheme;

  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private animationFrameId: number | null = null;
  private resizeListener: (() => void) | null = null;
  private dots: Dot[] = [];

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private readonly spacing = 25;

  constructor() {
    effect(() => {
      this.theme();

      if (!this.isServer && this.canvas && this.ctx) {
        this.drawFrame();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.isServer) return;

    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) return;

    const resizeCanvas = () => {
      if (!this.canvas) return;

      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      this.createDots();
    };

    resizeCanvas();

    this.resizeListener = resizeCanvas;
    window.addEventListener('resize', this.resizeListener);

    this.animate();
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private createDots(): void {
    if (!this.canvas) return;

    this.dots = [];

    const baseOpacity = this.theme() === 'dark' ? 0.15 : 0.18;

    for (let x = 0; x < this.canvas.width; x += this.spacing) {
      for (let y = 0; y < this.canvas.height; y += this.spacing) {
        this.dots.push({
          x,
          y,
          baseOpacity,
          currentOpacity: baseOpacity,
        });
      }
    }
  }

  private time = 0;

  private readonly waveSpeed = 0.008;
  private readonly waveFrequency = 0.003;
  private readonly waveAmplitude = 0.6;

  private animate = (): void => {
    this.drawFrame();

    this.time += this.waveSpeed;
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private drawFrame(): void {
    if (!this.canvas || !this.ctx) return;

    const {width, height} = this.canvas;
    const isDark = this.theme() === 'dark';

    const dotColor = isDark ? {r: 76, g: 217, b: 157} : {r: 22, g: 163, b: 117};

    const maxOpacity = isDark ? 0.75 : 0.32;

    this.ctx.clearRect(0, 0, width, height);

    this.dots.forEach((dot) => {
      const distance = Math.sqrt(Math.pow(dot.x - width / 2, 2) + Math.pow(dot.y - height / 2, 2));

      const wave = Math.sin(distance * this.waveFrequency - this.time) * this.waveAmplitude;

      dot.baseOpacity = isDark ? 0.15 : 0.08;
      dot.currentOpacity = Math.min(maxOpacity, Math.max(dot.baseOpacity, dot.baseOpacity + wave));

      this.ctx!.fillStyle = `rgba(${dotColor.r}, ${dotColor.g}, ${dotColor.b}, ${dot.currentOpacity})`;
      this.ctx!.beginPath();
      this.ctx!.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
      this.ctx!.fill();
    });
  }
}

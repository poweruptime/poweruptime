import {isPlatformServer} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';

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
      [style.background]="'hsl(240 5% 9%)'"></canvas>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DotBackground implements AfterViewInit, OnDestroy {
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private animationFrameId: number | null = null;
  private resizeListener: (() => void) | null = null;

  ngAfterViewInit(): void {
    if (this.isServer) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    this.resizeListener = () => resizeCanvas();
    window.addEventListener('resize', this.resizeListener);

    const spacing = 25;
    const dots: Dot[] = [];

    for (let x = 0; x < canvas.width; x += spacing) {
      for (let y = 0; y < canvas.height; y += spacing) {
        dots.push({
          x,
          y,
          baseOpacity: 0.15,
          currentOpacity: 0.15,
        });
      }
    }

    let time = 0;
    const waveSpeed = 0.008;
    const waveFrequency = 0.003;
    const waveAmplitude = 0.6;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        const distance = Math.sqrt(
          Math.pow(dot.x - canvas.width / 2, 2) + Math.pow(dot.y - canvas.height / 2, 2),
        );
        const wave = Math.sin(distance * waveFrequency - time) * waveAmplitude;

        dot.currentOpacity = Math.max(dot.baseOpacity, dot.baseOpacity + wave);

        ctx.fillStyle = `rgba(76, 217, 157, ${dot.currentOpacity})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      time += waveSpeed;
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

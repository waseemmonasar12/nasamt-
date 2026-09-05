import React, { useEffect, useRef } from 'react';

interface WinterCanvasProps {
  enabled?: boolean;
  intensity?: 'light' | 'normal' | 'cozy';
  reducedMotion?: boolean;
}

export const WinterCanvas: React.FC<WinterCanvasProps> = ({
  enabled = true,
  intensity = 'light',
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resizeObserver = new ResizeObserver(() => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
    resizeObserver.observe(document.body);

    const flakeCount = intensity === 'light' ? 45 : intensity === 'cozy' ? 90 : 65;
    const flakes: {
      x: number;
      y: number;
      r: number;
      d: number;
      opacity: number;
      swaySpeed: number;
      swayOffset: number;
    }[] = [];

    for (let i = 0; i < flakeCount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.8,
        d: Math.random() * 0.7 + 0.3, // fall speed
        opacity: Math.random() * 0.5 + 0.2,
        swaySpeed: Math.random() * 0.02 + 0.005,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angle += 0.01;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.d;
        f.x += Math.sin(angle + f.swayOffset) * 0.4;

        // Reset flake when it falls below screen
        if (f.y > height) {
          f.y = -10;
          f.x = Math.random() * width;
        }
        if (f.x > width) f.x = 0;
        if (f.x < 0) f.x = width;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, false);
        ctx.fillStyle = `rgba(224, 242, 254, ${f.opacity})`;
        ctx.shadowColor = 'rgba(186, 230, 253, 0.4)';
        ctx.shadowBlur = 4;
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [enabled, intensity, reducedMotion]);

  if (!enabled || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ opacity: 0.85 }}
    />
  );
};

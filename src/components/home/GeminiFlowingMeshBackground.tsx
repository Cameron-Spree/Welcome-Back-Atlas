import React, { useEffect, useRef } from 'react';

export const GeminiFlowingMeshBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let step = 0;

    // Define 5 flowing digital ribbons (Gemini-style organic waves)
    const waves = [
      { speed: 0.008, amplitude: 65, wavelength: 0.0025, phase: 0, color: 'rgba(0, 0, 0, 0.035)', lineWidth: 2 },
      { speed: 0.012, amplitude: 90, wavelength: 0.0018, phase: 2, color: 'rgba(0, 0, 0, 0.045)', lineWidth: 1.5 },
      { speed: 0.006, amplitude: 120, wavelength: 0.0012, phase: 4, color: 'rgba(255, 255, 255, 0.7)', lineWidth: 3 },
      { speed: 0.015, amplitude: 50, wavelength: 0.0035, phase: 1, color: 'rgba(100, 116, 139, 0.06)', lineWidth: 1 },
      { speed: 0.009, amplitude: 80, wavelength: 0.002, phase: 3, color: 'rgba(0, 0, 0, 0.03)', lineWidth: 2 },
    ];

    // Digital floating ambient particles
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step += 1;

      // Draw subtle digital floating grid dots
      const gridGap = 48;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
      for (let x = 24; x < width; x += gridGap) {
        for (let y = 24; y < height; y += gridGap) {
          const distFromCenter = Math.hypot(x - width / 2, y - height / 2);
          const dotAlpha = Math.max(0, 1 - distFromCenter / (width * 0.75));
          if (dotAlpha > 0.1) {
            ctx.beginPath();
            ctx.arc(x, y, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw floating digital particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${p.alpha * 0.12})`;
        ctx.fill();
      });

      // Draw flowing Gemini waves
      const centerY = height * 0.52;

      waves.forEach((w, waveIdx) => {
        ctx.beginPath();
        ctx.lineWidth = w.lineWidth;
        ctx.strokeStyle = w.color;

        const currentPhase = step * w.speed + w.phase;

        for (let x = 0; x <= width; x += 6) {
          // Complex organic wave composed of two harmonic sine components
          const y =
            centerY +
            Math.sin(x * w.wavelength + currentPhase) * w.amplitude +
            Math.cos(x * (w.wavelength * 1.5) - currentPhase * 0.8) * (w.amplitude * 0.4);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Fill subtle gradient below main wave
        if (waveIdx === 1 || waveIdx === 2) {
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, centerY - 100, 0, height);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
          grad.addColorStop(1, 'rgba(240, 240, 245, 0.2)');
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Dynamic Animated Canvas Waves */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />

      {/* Floating Ambient Glowing Blobs with CSS Keyframe drift */}
      <div className="absolute top-[10%] left-[15%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-zinc-200/50 via-white/70 to-transparent blur-3xl animate-pulse opacity-60" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[40%] right-[10%] w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-zinc-200/40 via-zinc-100/50 to-white/80 blur-3xl opacity-70" />
      <div className="absolute bottom-[5%] left-[30%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-zinc-200/35 via-white/80 to-transparent blur-3xl opacity-80" />
    </div>
  );
};

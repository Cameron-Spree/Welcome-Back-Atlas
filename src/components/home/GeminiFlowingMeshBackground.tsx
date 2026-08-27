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

    // Gemini-style luminous flowing ribbon waves
    const ribbons = [
      {
        speed: 0.008,
        amplitude: 85,
        wavelength: 0.0018,
        phase: 0,
        colorStart: 'rgba(56, 189, 248, 0.45)', // Sky blue
        colorEnd: 'rgba(129, 140, 248, 0.35)',   // Indigo
        lineWidth: 3,
        fillAlpha: 0.06,
      },
      {
        speed: 0.012,
        amplitude: 110,
        wavelength: 0.0014,
        phase: 2.2,
        colorStart: 'rgba(168, 85, 247, 0.4)',  // Purple
        colorEnd: 'rgba(244, 114, 182, 0.35)',  // Pink
        lineWidth: 2.5,
        fillAlpha: 0.05,
      },
      {
        speed: 0.006,
        amplitude: 140,
        wavelength: 0.001,
        phase: 4.1,
        colorStart: 'rgba(99, 102, 241, 0.35)', // Electric Indigo
        colorEnd: 'rgba(45, 212, 191, 0.35)',   // Teal
        lineWidth: 3.5,
        fillAlpha: 0.07,
      },
      {
        speed: 0.015,
        amplitude: 65,
        wavelength: 0.0028,
        phase: 1.5,
        colorStart: 'rgba(251, 191, 36, 0.3)',  // Warm Amber
        colorEnd: 'rgba(236, 72, 153, 0.3)',    // Magenta
        lineWidth: 2,
        fillAlpha: 0.04,
      },
    ];

    // Constellation points
    const particleCount = 35;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1.2,
      speedX: (Math.random() - 0.5) * 0.45,
      speedY: (Math.random() - 0.5) * 0.45,
      hue: Math.random() > 0.5 ? 210 : 270, // Blue or Purple
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step += 1;

      // 1. Draw floating constellation particles with delicate connector lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 210 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(168, 85, 247, 0.5)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 2. Draw harmonic flowing Gemini Aurora waves
      const centerY = height * 0.5;

      ribbons.forEach((r) => {
        ctx.beginPath();
        const currentPhase = step * r.speed + r.phase;

        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, r.colorStart);
        grad.addColorStop(1, r.colorEnd);

        ctx.strokeStyle = grad;
        ctx.lineWidth = r.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw upper wave curve
        for (let x = 0; x <= width; x += 8) {
          const y =
            centerY +
            Math.sin(x * r.wavelength + currentPhase) * r.amplitude +
            Math.cos(x * (r.wavelength * 1.6) - currentPhase * 0.7) * (r.amplitude * 0.45);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Draw soft ambient color glow underneath the wave
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(0, centerY - 80, 0, height);
        fillGrad.addColorStop(0, r.colorStart.replace(/[\d.]+\)$/, `${r.fillAlpha})`));
        fillGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-white">
      {/* Dynamic Animated Canvas Waves */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Luminous Glowing Aurora Blurs (Gemini Electric Glow on Pure White) */}
      <div
        className="absolute top-[-10%] left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-400/30 via-indigo-400/25 to-purple-300/30 blur-[120px] animate-pulse"
        style={{ animationDuration: '6s' }}
      />
      <div
        className="absolute top-[35%] right-[-5%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-purple-400/30 via-pink-400/25 to-sky-300/25 blur-[130px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-10%] left-[25%] w-[700px] h-[700px] rounded-full bg-gradient-to-t from-cyan-400/25 via-sky-300/20 to-transparent blur-[140px]"
      />
    </div>
  );
};

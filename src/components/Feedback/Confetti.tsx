import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; rotation: number; rotSpeed: number;
  life: number; maxLife: number;
}

const COLORS = ["#00E5FF", "#B026FF", "#00FF66", "#FFD700", "#FF3366", "#FF8C00"];

interface Props {
  originX?: number;
  originY?: number;
  particleCount?: number;
  onDone?: () => void;
}

export function Confetti({ originX, originY, particleCount = 60, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = originX ?? canvas.width / 2;
    const cy = originY ?? canvas.height / 2;

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      const maxLife = 60 + Math.random() * 40;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        life: 0,
        maxLife,
      });
    }

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (alive > 0) frame = requestAnimationFrame(animate);
      else onDone?.();
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [originX, originY, particleCount, onDone]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-[400] pointer-events-none" />
  );
}

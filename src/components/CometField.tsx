import { useEffect, useRef, useCallback, memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const SECTION_THEMES = [
  { core: [191, 100, 62], glow: [191, 100, 70], trail: [191, 80, 75] },
  { core: [280, 80, 65], glow: [270, 90, 60], trail: [290, 60, 75] },
  { core: [150, 90, 55], glow: [160, 85, 50], trail: [140, 70, 70] },
  { core: [340, 90, 60], glow: [350, 85, 55], trail: [330, 70, 70] },
  { core: [35, 95, 58], glow: [40, 90, 55], trail: [30, 80, 70] },
];

interface Comet {
  x: number; y: number; vx: number; vy: number; size: number;
  coreColor: number[]; glowColor: number[]; trailColor: number[];
  targetCore: number[]; targetGlow: number[]; targetTrail: number[];
  trail: { x: number; y: number; alpha: number }[];
  glowRadius: number; targetGlowRadius: number;
  sectionIndex: number; collisionCooldown: number;
  canPop: boolean; // only some comets pop at boundaries
}

interface Ripple { x: number; y: number; radius: number; maxRadius: number; alpha: number; color: number[]; }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: number[]; size: number; }

function hslStr(h: number, s: number, l: number, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpColor(from: number[], to: number[], t: number): number[] {
  return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
}
function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

const CometFieldComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const cometsRef = useRef<Comet[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const smoothScrollRef = useRef(0);
  const targetScrollRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const sectionBoundsRef = useRef<number[]>([]);
  const animFrameRef = useRef(0);
  const lastCollisionRef = useRef(0);

  const COMET_COUNT = isMobile ? 8 : 20;
  const TRAIL_LENGTH = isMobile ? 18 : 35;

  const createComet = useCallback((w: number, h: number): Comet => {
    const theme = SECTION_THEMES[0];
    return {
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2.5 + 1.5,
      coreColor: [...theme.core], glowColor: [...theme.glow], trailColor: [...theme.trail],
      targetCore: [...theme.core], targetGlow: [...theme.glow], targetTrail: [...theme.trail],
      trail: [],
      glowRadius: 18 + Math.random() * 14, targetGlowRadius: 18 + Math.random() * 14,
      sectionIndex: 0, collisionCooldown: 0,
      canPop: Math.random() < 0.35, // only ~35% of comets pop
    };
  }, []);

  const getSectionAtY = useCallback((y: number): number => {
    const bounds = sectionBoundsRef.current;
    const scrollY = smoothScrollRef.current;
    const absY = y + scrollY;
    for (let i = bounds.length - 1; i >= 0; i--) {
      if (absY >= bounds[i]) return Math.min(i, SECTION_THEMES.length - 1);
    }
    return 0;
  }, []);

  const spawnRipple = useCallback((x: number, y: number, color: number[], maxR = 70) => {
    ripplesRef.current.push({ x, y, radius: 2, maxRadius: maxR, alpha: 0.55, color });
  }, []);

  const spawnSparks = useCallback((x: number, y: number, color: number[], count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 2;
      sparksRef.current.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, maxLife: 0.6 + Math.random() * 0.4, color, size: 1 + Math.random() * 1.2,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    cometsRef.current = Array.from({ length: COMET_COUNT }, () =>
      createComet(window.innerWidth, window.innerHeight)
    );

    const updateSectionBounds = () => {
      const sections = document.querySelectorAll('[data-comet-section]');
      sectionBoundsRef.current = Array.from(sections).map(el => {
        const rect = el.getBoundingClientRect();
        return rect.top + window.scrollY;
      });
    };
    updateSectionBounds();

    const onScroll = () => {
      targetScrollRef.current = window.scrollY;
      updateSectionBounds();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Smooth scroll interpolation to prevent glitching
      smoothScrollRef.current = lerp(smoothScrollRef.current, targetScrollRef.current, 0.12);

      const now = Date.now();
      const comets = cometsRef.current;
      const ripples = ripplesRef.current;
      const sparks = sparksRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < comets.length; i++) {
        const c = comets[i];

        // Gentle cursor repulsion
        const dMouse = dist(c.x, c.y, mouse.x, mouse.y);
        if (dMouse < 100) {
          const force = (100 - dMouse) / 100 * 0.15;
          const angle = Math.atan2(c.y - mouse.y, c.x - mouse.x);
          c.vx += Math.cos(angle) * force;
          c.vy += Math.sin(angle) * force;
        }

        c.vx *= 0.997;
        c.vy *= 0.997;

        const speed = Math.sqrt(c.vx ** 2 + c.vy ** 2);
        if (speed < 0.1) {
          c.vx += (Math.random() - 0.5) * 0.06;
          c.vy += (Math.random() - 0.5) * 0.06;
        }
        // Cap max speed to prevent jitter
        if (speed > 2.2) {
          c.vx *= 2.2 / speed;
          c.vy *= 2.2 / speed;
        }

        c.x += c.vx;
        c.y += c.vy;

        if (c.x < -20) c.x = w + 20;
        if (c.x > w + 20) c.x = -20;
        if (c.y < -20) c.y = h + 20;
        if (c.y > h + 20) c.y = -20;

        // Section color transition — smooth, only some pop
        const sIdx = getSectionAtY(c.y);
        if (sIdx !== c.sectionIndex) {
          const theme = SECTION_THEMES[sIdx] || SECTION_THEMES[0];
          c.targetCore = [...theme.core];
          c.targetGlow = [...theme.glow];
          c.targetTrail = [...theme.trail];

          if (c.canPop) {
            c.glowRadius = c.targetGlowRadius + 20;
            spawnRipple(c.x, c.y, theme.core, 60);
            spawnSparks(c.x, c.y, theme.core, 8);
          }
          // No speed boost — keeps motion stable
          c.sectionIndex = sIdx;
        }

        // Slow, smooth color lerp for seamless transitions
        const colorSpeed = 0.025;
        c.coreColor = lerpColor(c.coreColor, c.targetCore, colorSpeed);
        c.glowColor = lerpColor(c.glowColor, c.targetGlow, colorSpeed);
        c.trailColor = lerpColor(c.trailColor, c.targetTrail, colorSpeed);
        c.glowRadius = lerp(c.glowRadius, c.targetGlowRadius, 0.03);

        if (c.collisionCooldown > 0) c.collisionCooldown--;

        c.trail.unshift({ x: c.x, y: c.y, alpha: 1 });
        if (c.trail.length > TRAIL_LENGTH) c.trail.pop();
        for (const t of c.trail) t.alpha *= 0.93;

        // Gentle collisions
        if (c.collisionCooldown <= 0 && now - lastCollisionRef.current > 2000) {
          for (let j = i + 1; j < comets.length; j++) {
            const other = comets[j];
            if (other.collisionCooldown > 0) continue;
            const d = dist(c.x, c.y, other.x, other.y);
            if (d < 25) {
              lastCollisionRef.current = now;
              const mx = (c.x + other.x) / 2;
              const my = (c.y + other.y) / 2;
              spawnSparks(mx, my, c.coreColor, 5);

              const angle = Math.atan2(c.y - other.y, c.x - other.x);
              const push = 0.4;
              c.vx += Math.cos(angle) * push;
              c.vy += Math.sin(angle) * push;
              other.vx -= Math.cos(angle) * push;
              other.vy -= Math.sin(angle) * push;

              c.collisionCooldown = 120;
              other.collisionCooldown = 120;
              break;
            }
          }
        }

        // Draw trail
        if (c.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(c.trail[0].x, c.trail[0].y);
          for (let t = 1; t < c.trail.length; t++) {
            ctx.lineTo(c.trail[t].x, c.trail[t].y);
          }
          const grad = ctx.createLinearGradient(
            c.trail[0].x, c.trail[0].y,
            c.trail[c.trail.length - 1].x, c.trail[c.trail.length - 1].y
          );
          grad.addColorStop(0, hslStr(c.trailColor[0], c.trailColor[1], c.trailColor[2], 0.5));
          grad.addColorStop(1, hslStr(c.trailColor[0], c.trailColor[1], c.trailColor[2], 0));
          ctx.strokeStyle = grad;
          ctx.lineWidth = c.size * 0.9;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Draw glow
        const glowGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.glowRadius);
        glowGrad.addColorStop(0, hslStr(c.glowColor[0], c.glowColor[1], c.glowColor[2], 0.35));
        glowGrad.addColorStop(0.4, hslStr(c.glowColor[0], c.glowColor[1], c.glowColor[2], 0.1));
        glowGrad.addColorStop(1, hslStr(c.glowColor[0], c.glowColor[1], c.glowColor[2], 0));
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fillStyle = hslStr(c.coreColor[0], c.coreColor[1], c.coreColor[2], 0.95);
        ctx.shadowColor = hslStr(c.coreColor[0], c.coreColor[1], c.coreColor[2], 0.8);
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 1.5;
        r.alpha -= 0.012;
        if (r.alpha <= 0 || r.radius >= r.maxRadius) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = hslStr(r.color[0], r.color[1], r.color[2], r.alpha * 0.4);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx; s.y += s.vy;
        s.vx *= 0.95; s.vy *= 0.95;
        s.life -= 0.025;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fillStyle = hslStr(s.color[0], s.color[1], s.color[2], s.life * 0.6);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [COMET_COUNT, TRAIL_LENGTH, createComet, getSectionAtY, spawnRipple, spawnSparks]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export const CometField = memo(CometFieldComponent);

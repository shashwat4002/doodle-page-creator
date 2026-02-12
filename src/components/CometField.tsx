import { useEffect, useRef, useCallback, memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Section color themes (HSL)
const SECTION_THEMES = [
  { core: [191, 100, 62], glow: [191, 100, 62], trail: [210, 40, 98] },   // Hero: Cyan
  { core: [260, 60, 55], glow: [245, 80, 60], trail: [260, 40, 80] },     // Features: Violet/Indigo
  { core: [310, 60, 55], glow: [180, 70, 50], trail: [290, 50, 70] },     // Stats: Magenta/Teal
  { core: [260, 60, 55], glow: [280, 50, 60], trail: [270, 40, 70] },     // Testimonials: Purple
  { core: [40, 90, 55], glow: [210, 80, 55], trail: [30, 60, 70] },       // CTA: Gold/Warm
];

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  coreColor: number[];
  glowColor: number[];
  trailColor: number[];
  targetCore: number[];
  targetGlow: number[];
  targetTrail: number[];
  trail: { x: number; y: number; alpha: number }[];
  glowRadius: number;
  targetGlowRadius: number;
  sectionIndex: number;
  collisionCooldown: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: number[];
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number[];
  size: number;
}

function hslStr(h: number, s: number, l: number, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

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
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const sectionBoundsRef = useRef<number[]>([]);
  const animFrameRef = useRef(0);
  const lastCollisionRef = useRef(0);
  const supernovaTimerRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());

  const COMET_COUNT = isMobile ? 8 : 18;
  const TRAIL_LENGTH = isMobile ? 12 : 25;

  const createComet = useCallback((w: number, h: number): Comet => {
    const theme = SECTION_THEMES[0];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2.5 + 1.5,
      coreColor: [...theme.core],
      glowColor: [...theme.glow],
      trailColor: [...theme.trail],
      targetCore: [...theme.core],
      targetGlow: [...theme.glow],
      targetTrail: [...theme.trail],
      trail: [],
      glowRadius: 15 + Math.random() * 10,
      targetGlowRadius: 15 + Math.random() * 10,
      sectionIndex: 0,
      collisionCooldown: 0,
    };
  }, []);

  const getSectionAtY = useCallback((y: number): number => {
    const bounds = sectionBoundsRef.current;
    const scrollY = scrollRef.current;
    const absY = y + scrollY;
    for (let i = bounds.length - 1; i >= 0; i--) {
      if (absY >= bounds[i]) return Math.min(i, SECTION_THEMES.length - 1);
    }
    return 0;
  }, []);

  const spawnRipple = useCallback((x: number, y: number, color: number[], maxR = 60) => {
    ripplesRef.current.push({
      x, y, radius: 2, maxRadius: maxR, alpha: 0.7, color,
    });
  }, []);

  const spawnSparks = useCallback((x: number, y: number, color: number[], count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 2;
      sparksRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        color,
        size: 1 + Math.random() * 1.5,
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

    // Init comets
    cometsRef.current = Array.from({ length: COMET_COUNT }, () =>
      createComet(window.innerWidth, window.innerHeight)
    );

    // Detect section boundaries
    const updateSectionBounds = () => {
      const sections = document.querySelectorAll('[data-comet-section]');
      sectionBoundsRef.current = Array.from(sections).map(el => {
        const rect = el.getBoundingClientRect();
        return rect.top + window.scrollY;
      });
    };
    updateSectionBounds();

    const onScroll = () => {
      scrollRef.current = window.scrollY;
      lastScrollTimeRef.current = Date.now();
      updateSectionBounds();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Main animation loop
    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const now = Date.now();
      const comets = cometsRef.current;
      const ripples = ripplesRef.current;
      const sparks = sparksRef.current;
      const mouse = mouseRef.current;

      // Supernova on long scroll pause
      if (now - lastScrollTimeRef.current > 12000 && now - supernovaTimerRef.current > 15000) {
        supernovaTimerRef.current = now;
        const c = comets[Math.floor(Math.random() * comets.length)];
        if (c) {
          spawnRipple(c.x, c.y, c.coreColor, 120);
          spawnSparks(c.x, c.y, c.coreColor, 16);
        }
      }

      // Update & draw comets
      for (let i = 0; i < comets.length; i++) {
        const c = comets[i];

        // Cursor repulsion
        const dMouse = dist(c.x, c.y, mouse.x, mouse.y);
        if (dMouse < 120) {
          const force = (120 - dMouse) / 120 * 0.3;
          const angle = Math.atan2(c.y - mouse.y, c.x - mouse.x);
          c.vx += Math.cos(angle) * force;
          c.vy += Math.sin(angle) * force;
        }

        // Velocity damping
        c.vx *= 0.995;
        c.vy *= 0.995;

        // Ensure minimum velocity
        const speed = Math.sqrt(c.vx ** 2 + c.vy ** 2);
        if (speed < 0.15) {
          c.vx += (Math.random() - 0.5) * 0.1;
          c.vy += (Math.random() - 0.5) * 0.1;
        }

        c.x += c.vx;
        c.y += c.vy;

        // Wrap around edges
        if (c.x < -20) c.x = w + 20;
        if (c.x > w + 20) c.x = -20;
        if (c.y < -20) c.y = h + 20;
        if (c.y > h + 20) c.y = -20;

        // Section detection & color transition
        const sIdx = getSectionAtY(c.y);
        if (sIdx !== c.sectionIndex) {
          const theme = SECTION_THEMES[sIdx] || SECTION_THEMES[0];
          c.targetCore = [...theme.core];
          c.targetGlow = [...theme.glow];
          c.targetTrail = [...theme.trail];
          c.targetGlowRadius = 15 + Math.random() * 10 + (sIdx === 4 ? 5 : 0);

          // Boundary ripple
          spawnRipple(c.x, c.y, c.coreColor, 50);
          c.sectionIndex = sIdx;
        }

        // Smooth color lerp
        const colorSpeed = 0.015;
        c.coreColor = lerpColor(c.coreColor, c.targetCore, colorSpeed);
        c.glowColor = lerpColor(c.glowColor, c.targetGlow, colorSpeed);
        c.trailColor = lerpColor(c.trailColor, c.targetTrail, colorSpeed);
        c.glowRadius = lerp(c.glowRadius, c.targetGlowRadius, 0.02);

        // Collision cooldown
        if (c.collisionCooldown > 0) c.collisionCooldown--;

        // Trail management
        c.trail.unshift({ x: c.x, y: c.y, alpha: 1 });
        if (c.trail.length > TRAIL_LENGTH) c.trail.pop();
        for (const t of c.trail) t.alpha *= 0.92;

        // Comet-to-comet collisions (only check forward pairs)
        if (c.collisionCooldown <= 0 && now - lastCollisionRef.current > 1500) {
          for (let j = i + 1; j < comets.length; j++) {
            const other = comets[j];
            if (other.collisionCooldown > 0) continue;
            const d = dist(c.x, c.y, other.x, other.y);
            if (d < 30) {
              lastCollisionRef.current = now;
              // Near-miss spark
              const mx = (c.x + other.x) / 2;
              const my = (c.y + other.y) / 2;
              spawnSparks(mx, my, c.coreColor, 10);
              spawnRipple(mx, my, c.coreColor, 40);

              // Redirect velocities
              const angle = Math.atan2(c.y - other.y, c.x - other.x);
              const push = 0.8;
              c.vx += Math.cos(angle) * push;
              c.vy += Math.sin(angle) * push;
              other.vx -= Math.cos(angle) * push;
              other.vy -= Math.sin(angle) * push;

              c.collisionCooldown = 90;
              other.collisionCooldown = 90;
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
          grad.addColorStop(0, hslStr(c.trailColor[0], c.trailColor[1], c.trailColor[2], 0.6));
          grad.addColorStop(1, hslStr(c.trailColor[0], c.trailColor[1], c.trailColor[2], 0));
          ctx.strokeStyle = grad;
          ctx.lineWidth = c.size * 0.8;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Draw glow
        const glowGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.glowRadius);
        glowGrad.addColorStop(0, hslStr(c.glowColor[0], c.glowColor[1], c.glowColor[2], 0.35));
        glowGrad.addColorStop(0.5, hslStr(c.glowColor[0], c.glowColor[1], c.glowColor[2], 0.1));
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
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 2;
        r.alpha -= 0.015;
        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = hslStr(r.color[0], r.color[1], r.color[2], r.alpha * 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Update & draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy *= 0.96;
        s.life -= 0.02;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fillStyle = hslStr(s.color[0], s.color[1], s.color[2], s.life * 0.8);
        ctx.shadowColor = hslStr(s.color[0], s.color[1], s.color[2], s.life);
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
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

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandRevealOverlayProps {
  onComplete: () => void;
}

const BrandRevealOverlayComponent = ({ onComplete }: BrandRevealOverlayProps) => {
  const [phase, setPhase] = useState<'glow' | 'reveal' | 'fade'>('glow');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 500);
    const t2 = setTimeout(() => setPhase('fade'), 2800);
    const t3 = setTimeout(() => onComplete(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2] pointer-events-none flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Radial golden glow */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'fade' ? 0 : 0.15 }}
          transition={{ duration: phase === 'fade' ? 0.8 : 0.6 }}
          style={{
            background: 'radial-gradient(circle at center, hsla(45, 90%, 70%, 0.3) 0%, hsla(45, 80%, 50%, 0.05) 40%, transparent 70%)',
          }}
        />

        {/* Golden flash ripple */}
        {phase === 'reveal' && (
          <motion.div
            className="absolute rounded-full"
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: 600, height: 600, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              background: 'radial-gradient(circle, hsla(45, 100%, 80%, 0.25) 0%, transparent 70%)',
              marginLeft: -300,
              marginTop: -300,
            }}
          />
        )}

        {/* Logo reveal */}
        <motion.div
          className="relative flex flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: phase === 'fade' ? 0 : phase === 'reveal' ? 1 : 0,
            scale: phase === 'reveal' ? 1 : 0.9,
          }}
          transition={{ duration: phase === 'fade' ? 0.6 : 0.8, ease: 'easeOut' }}
        >
          {/* Glow behind text */}
          <div
            className="absolute -inset-16 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, hsla(191, 100%, 62%, 0.15) 0%, hsla(45, 90%, 70%, 0.08) 50%, transparent 80%)',
              filter: 'blur(20px)',
            }}
          />

          {/* Logo text */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-[0.2em] text-foreground relative"
            style={{
              textShadow: '0 0 30px hsla(45, 90%, 70%, 0.5), 0 0 60px hsla(191, 100%, 62%, 0.2)',
            }}
          >
            SOCHX
          </motion.h1>

          {/* Shimmer pass */}
          {phase === 'reveal' && (
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeInOut' }}
            >
              <div
                className="w-1/3 h-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsla(45, 100%, 85%, 0.4), transparent)',
                }}
              />
            </motion.div>
          )}

          {/* Tagline */}
          <motion.p
            className="text-sm md:text-base tracking-[0.3em] uppercase text-muted-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: phase === 'reveal' ? 0.7 : 0, y: phase === 'reveal' ? 0 : 8 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Research Reimagined
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const BrandRevealOverlay = memo(BrandRevealOverlayComponent);

'use client';

import React, { useMemo, useSyncExternalStore } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Particle {
  id: number;
  x: string;
  y: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
}

interface FloatingParticlesProps {
  /** Number of particles to render */
  count?: number;
  /** Extra CSS classes on the container */
  className?: string;
}

const NEON_COLORS = [
  'rgba(255, 0, 127, 0.35)',
  'rgba(0, 243, 255, 0.35)',
  'rgba(57, 255, 20, 0.25)',
  'rgba(124, 58, 237, 0.3)',
];

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: 3 + Math.random() * 5,
    color: NEON_COLORS[i % NEON_COLORS.length],
    duration: 12 + Math.random() * 14,
    delay: Math.random() * 6,
    dx: (Math.random() - 0.5) * 60,
    dy: (Math.random() - 0.5) * 40,
  }));
}

/* Stable functions for useSyncExternalStore to track mounted state */
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 18,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const particles = useMemo(() => {
    if (!mounted) return [];
    return buildParticles(count);
  }, [count, mounted]);

  if (prefersReduced || !mounted) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            filter: `blur(${p.size * 0.4}px)`,
          }}
          animate={{
            x: [0, p.dx, -p.dx * 0.6, 0],
            y: [0, p.dy, -p.dy * 0.7, 0],
            opacity: [0.4, 0.8, 0.5, 0.4],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

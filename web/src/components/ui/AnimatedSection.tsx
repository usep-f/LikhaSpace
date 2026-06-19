'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/* ─── Shared spring config ─── */
const SPRING = { type: 'spring' as const, stiffness: 60, damping: 16 };

/* ─── Reusable Variants ─── */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
};

/* ─── AnimatedSection ─── */

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger children if true (wrap each child in motion.div) */
  stagger?: boolean;
  /** Additional delay before the section animates (seconds) */
  delay?: number;
  /** Viewport trigger amount (0-1). Default 0.15 */
  viewportAmount?: number;
  /** HTML tag override */
  as?: 'section' | 'div';
  /** Whether the animation should only play once. Default is false to play on both scroll down and up. */
  playOnce?: boolean;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className,
  stagger = false,
  delay = 0,
  viewportAmount = 0.15,
  as = 'div',
  playOnce = false,
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const Component = as === 'section' ? motion.section : motion.div;

  return (
    <Component
      variants={stagger ? staggerContainerVariants : fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: playOnce, amount: viewportAmount }}
      transition={delay > 0 ? { delay } : undefined}
      className={className}
    >
      {children}
    </Component>
  );
};

/* ─── AnimatedItem (for use inside stagger containers) ─── */

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  className,
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
};

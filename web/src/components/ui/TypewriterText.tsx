'use client';

import React, { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface TypewriterTextProps {
  text: string;
  startDelay?: number;
  charSpeed?: number;
  className?: string;
  onComplete?: () => void;
  instant?: boolean;
}

/**
 * Typewriter that uses setInterval (iterative, not recursive)
 * to satisfy React 19's strict hooks/immutability lint rule.
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startDelay = 400,
  charSpeed = 45,
  className = '',
  onComplete,
  instant = false,
}) => {
  const prefersReduced = useReducedMotion();
  const shouldSkip = prefersReduced || instant;

  const spanRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  /**
   * Ref callback: starts an interval-based typing loop on mount.
   * No recursive functions needed — avoids the hooks/immutability lint.
   */
  const containerRefCallback = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node || startedRef.current) return;
      startedRef.current = true;

      if (shouldSkip) {
        if (spanRef.current) spanRef.current.textContent = text;
        onComplete?.();
        return;
      }

      /* Start typing after delay using an iterative interval */
      const delayId = setTimeout(() => {
        let idx = 0;

        const intervalId = setInterval(() => {
          idx += 1;

          if (spanRef.current) {
            spanRef.current.textContent = text.slice(0, idx);
          }

          if (idx >= text.length) {
            clearInterval(intervalId);
            if (cursorRef.current) {
              cursorRef.current.style.display = 'none';
            }
            onComplete?.();
          }
        }, charSpeed);
      }, startDelay);

      /* Cleanup is not strictly needed for a ref callback,
         but we keep a reference for safety. */
      void delayId;
    },
    [shouldSkip, text, startDelay, charSpeed, onComplete],
  );

  if (shouldSkip) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className} ref={containerRefCallback}>
      <span ref={spanRef} />
      <AnimatePresence>
        <motion.span
          ref={cursorRef}
          key="cursor"
          className="inline-block w-[3px] h-[1em] bg-hotpink ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          exit={{ opacity: 0 }}
        />
      </AnimatePresence>
    </span>
  );
};

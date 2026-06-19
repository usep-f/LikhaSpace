'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Returns true if the user has prefers-reduced-motion enabled at OS level.
 * Uses useSyncExternalStore to subscribe to OS media query changes.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(QUERY);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    getSnapshot,
    getServerSnapshot,
  );
}

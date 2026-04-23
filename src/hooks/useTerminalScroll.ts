import { useRef, useEffect } from 'react';

/**
 * Auto-scrolls an element to the bottom whenever
 * the dependency changes (e.g., new logs appended).
 */
export function useTerminalScroll<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [dependency]);

  return ref;
}

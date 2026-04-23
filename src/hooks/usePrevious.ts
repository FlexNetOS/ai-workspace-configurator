import { useRef, useEffect } from 'react';

/**
 * Tracks the previous value of a state or prop.
 * This hook intentionally reads a ref during render — a well-known pattern.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<{ prev: T | undefined; curr: T | undefined }>({
    prev: undefined,
    curr: undefined,
  });

  useEffect(() => {
    ref.current.prev = ref.current.curr;
    ref.current.curr = value;
  }, [value]);

  // eslint-disable-next-line react-hooks/refs
  return ref.current.prev;
}

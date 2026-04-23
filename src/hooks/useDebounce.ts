import { useState, useEffect } from 'react';

/**
 * Debounces a value by the specified delay (ms).
 * Useful for search inputs and form fields.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

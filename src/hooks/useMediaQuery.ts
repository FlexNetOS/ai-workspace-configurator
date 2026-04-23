import { useState, useEffect } from 'react';

/**
 * General-purpose media query hook.
 * Replaces the hardcoded `use-mobile.ts` with arbitrary query support.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Convenience hook for the mobile breakpoint (max-width: 767px).
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

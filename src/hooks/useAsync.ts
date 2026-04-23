import { useState, useCallback, useRef } from 'react';

interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Wraps an async function with loading, error, and data states.
 * Automatically cancels stale executions.
 */
export function useAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>
): AsyncState<T> & { execute: (...args: Args) => Promise<T | undefined> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    loading: false,
    error: undefined,
  });

  const versionRef = useRef(0);

  const execute = useCallback(
    async (...args: Args) => {
      const version = ++versionRef.current;
      setState(s => ({ ...s, loading: true, error: undefined }));

      try {
        const data = await fn(...args);
        if (version === versionRef.current) {
          setState({ data, loading: false, error: undefined });
        }
        return data;
      } catch (err) {
        if (version === versionRef.current) {
          setState({ data: undefined, loading: false, error: err as Error });
        }
        return undefined;
      }
    },
    [fn]
  );

  return { ...state, execute };
}

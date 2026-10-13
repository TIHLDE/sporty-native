import { useEffect, useState } from 'react';

/** Verdien, men først etter at den har stått stille i `delay` ms. Brukes for søk mens man skriver. */
export function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

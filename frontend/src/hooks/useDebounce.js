import { useState, useEffect, useRef } from 'react';

/**
 * Debounce nilai input dalam milliseconds.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Deteksi breakpoint mobile (<768px).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

/**
 * Sinkronisasi state ke URL query params dan sebaliknya.
 */
export function useUrlState(key, defaultValue = '') {
  const getFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? defaultValue;
  };

  const [value, setValue] = useState(getFromUrl);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== defaultValue) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
    window.history.replaceState(null, '', newUrl);
  }, [value]);

  return [value, setValue];
}


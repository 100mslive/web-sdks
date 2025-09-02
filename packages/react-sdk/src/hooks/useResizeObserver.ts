import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizeObserverSize {
  width: number | undefined;
  height: number | undefined;
}

export function useResizeDetector<T extends HTMLElement = HTMLElement>() {
  const [size, setSize] = useState<ResizeObserverSize>({ width: undefined, height: undefined });
  const ref = useRef<T>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!entries || entries.length === 0) {
      return;
    }

    const entry = entries[0];
    if (!entry) {
      return;
    }

    const { width, height } = entry.contentRect;

    setSize(prevSize => {
      if (prevSize.width === width && prevSize.height === height) {
        return prevSize;
      }
      return { width, height };
    });
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    // Check if ResizeObserver is available
    if (typeof ResizeObserver === 'undefined') {
      console.warn('ResizeObserver is not available');
      // Fallback to getting initial size
      const { width, height } = element.getBoundingClientRect();
      setSize({ width, height });
      return;
    }

    if (!observerRef.current) {
      try {
        observerRef.current = new ResizeObserver(handleResize);
      } catch (error) {
        console.error('Failed to create ResizeObserver:', error);
        return;
      }
    }

    try {
      observerRef.current.observe(element);
    } catch (error) {
      console.error('Failed to observe element:', error);
    }

    return () => {
      if (observerRef.current && element) {
        try {
          observerRef.current.unobserve(element);
        } catch (error) {
          console.error('Failed to unobserve element:', error);
        }
      }
    };
  }, [handleResize]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        try {
          observerRef.current.disconnect();
          observerRef.current = null;
        } catch (error) {
          console.error('Failed to disconnect ResizeObserver:', error);
        }
      }
    };
  }, []);

  return {
    width: size.width,
    height: size.height,
    ref,
  };
}

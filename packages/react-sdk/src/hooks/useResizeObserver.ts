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
    if (entries.length === 0) {
      return;
    }

    const entry = entries[0];
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

    if (!observerRef.current) {
      observerRef.current = new ResizeObserver(handleResize);
    }

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [handleResize]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return {
    width: size.width,
    height: size.height,
    ref,
  };
}

import { useEffect, useState } from 'react';
import { DEFAULT_PORTAL_CONTAINER } from '../../common/constants';

export function useContainerQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // CASE 1: Container query (ref provided)
    const container = document.querySelector(DEFAULT_PORTAL_CONTAINER);
    if (container) {
      const el = container;

      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;

          const maxMatch = /max-width:\s*(\d+)px/.exec(query);
          const minMatch = /min-width:\s*(\d+)px/.exec(query);

          let ok = true;
          console.log({ width, maxMatch, minMatch });
          if (maxMatch) ok &&= width <= parseInt(maxMatch[1], 10);
          if (minMatch) ok &&= width >= parseInt(minMatch[1], 10);

          setMatches(ok);
        }
      });

      ro.observe(el);
      return () => ro.disconnect();
    }

    // CASE 2: Fallback to window.matchMedia
    const mql = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    setMatches(mql.matches);
    mql.addEventListener('change', listener);

    return () => mql.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

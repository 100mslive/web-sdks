import { useEffect, useState } from 'react';

export function useContainerQuery(query: string, ref?: React.RefObject<HTMLElement>) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // CASE 1: Container query (ref provided)
    if (ref?.current) {
      const el = ref.current;

      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;

          const maxMatch = /max-width:\s*(\d+)px/.exec(query);
          const minMatch = /min-width:\s*(\d+)px/.exec(query);

          let ok = true;
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
  }, [query, ref]);

  return matches;
}

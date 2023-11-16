export function useSearchParam(param) {
  if (typeof window === 'undefined') {
    return '';
  }
  const url = new URL(window.location.href);
  return url.searchParams.get(param) || undefined;
}

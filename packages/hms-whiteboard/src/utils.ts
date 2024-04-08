export function getQueryParams(url?: string) {
  if (!url) url = window.location.search;
  const query = url.substr(1);
  return query.split('&').reduce((result, part) => {
    const item = part.split('=');
    result[item[0]] = decodeURIComponent(item[1]);
    return result;
  }, {} as Record<string, string | undefined>);
}

export default function decodeJWT(token?: string) {
  if (!token || token.length === 0) {
    throw Error('Token cannot be an empty string or undefined or null');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw Error(`Expected 3 '.' separate fields - header, payload and signature respectively`);
  }

  const payloadStr = atob(parts[1]);
  try {
    return JSON.parse(payloadStr);
  } catch (err) {
    throw Error(`couldn't parse to json - ${(err as Error).message}`);
  }
}

export const CURRENT_PAGE_KEY = 'currentPage';
export const SHAPES_THROTTLE_TIME = 11;
export const PAGES_DEBOUNCE_TIME = 200;

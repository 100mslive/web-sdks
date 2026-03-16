import { BACKOFF_MULTIPLIER, MAX_BACKOFF_MS } from './constants';

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
export interface BackoffState {
  attempt: number;
  currentDelay: number;
}

export const calculateBackoff = (state: BackoffState): number => {
  const delay = Math.min(state.currentDelay * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
};

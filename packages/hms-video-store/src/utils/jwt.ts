import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';

export interface AuthToken {
  roomId: string;
  userId: string;
  role: string;
}

/**
 * JWT segments are base64url encoded and their text is UTF-8, while atob only understands
 * standard base64 and returns a binary string.
 */
function decodeBase64Url(segment: string): string {
  const binary = atob(segment.replace(/-/g, '+').replace(/_/g, '/'));
  const percentEncoded = Array.from(binary, character => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`);
  return decodeURIComponent(percentEncoded.join(''));
}

export default function decodeJWT(token?: string): AuthToken {
  if (!token || token.length === 0) {
    throw ErrorFactory.APIErrors.InvalidTokenFormat(
      HMSAction.INIT,
      'Token cannot be an empty string or undefined or null',
    );
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw ErrorFactory.APIErrors.InvalidTokenFormat(
      HMSAction.INIT,
      `Expected 3 '.' separate fields - header, payload and signature respectively`,
    );
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return {
      roomId: payload.room_id,
      userId: payload.user_id,
      role: payload.role,
    } as AuthToken;
  } catch (err) {
    throw ErrorFactory.APIErrors.InvalidTokenFormat(
      HMSAction.INIT,
      `couldn't parse to json - ${(err as Error).message}`,
    );
  }
}

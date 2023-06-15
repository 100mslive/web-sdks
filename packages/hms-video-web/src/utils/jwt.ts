import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';

export interface AuthToken {
  roomId: string;
  userId: string;
  role: string;
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

  const payloadStr = atob(parts[1]);
  try {
    const payload = JSON.parse(payloadStr);
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

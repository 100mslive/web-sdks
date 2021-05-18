import HMSErrors from '../error/HMSErrors';
import { HMSExceptionBuilder } from '../error/HMSException';

export interface AuthToken {
  roomId: string;
  userId: string;
  role: string;
}

export default function decodeJWT(token: string): AuthToken {
  if (token.length === 0) {
    throw new HMSExceptionBuilder(HMSErrors.MissingToken).build();
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new HMSExceptionBuilder(HMSErrors.InvalidTokenFormat).build();
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
    throw new HMSExceptionBuilder(HMSErrors.TokenMissingRoomId).build();
  }
}

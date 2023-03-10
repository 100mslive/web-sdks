export interface TokenRequest {
  roomCode: string;
  userId?: string;
}

export interface TokenRequestOptions {
  endpoint?: string;
}

export interface TokenResult {
  token: string;
  expiresAt: string;
  roomId: string;
  role: string;
}

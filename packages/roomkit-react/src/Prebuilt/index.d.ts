import React from 'react';

export declare const HMSPrebuilt: React.FC<{
  roomCode: string;
  logo?: {
    url: string;
  };
  options?: {
    endpoints?: {
      tokenByRoomIdRole?: string;
      tokenByRoomCode?: string;
      init?: string;
      roomLayout?: string;
    };
  };
}>;

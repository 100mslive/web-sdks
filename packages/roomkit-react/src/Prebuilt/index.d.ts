import React from 'react';

export declare const HMSPrebuilt: React.FC<{
  roomCode: string;
  logo?: {
    url: string;
  };
  options?: {
    endPoints?: {
      tokenByRoomIdRole?: string;
      tokenByRoomCode?: string;
      init?: string;
    };
  };
}>;

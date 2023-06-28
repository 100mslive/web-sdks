import React from 'react';

export declare const HMSPrebuilt: React.FC<{
  roomCode: string;
  themeConfig: {
    aspectRatio: string;
    theme: string;
    color: string;
    logo: string;
    font: string;
  };
  options: {
    endPoints?: {
      tokenByRoomIdRole?: string;
      tokenByRoomCode?: string;
      init?: string;
    };
  };
}>;

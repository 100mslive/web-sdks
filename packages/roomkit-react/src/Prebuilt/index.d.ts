import React from 'react';
import type { Screens, Theme, Typography } from '@100mslive/types-prebuilt';

export declare const HMSPrebuilt: React.FC<{
  roomCode: string;
  logo?: {
    url: string;
  };
  themes?: Theme[];
  typography?: Typography;
  screens?: Screens;
  options?: {
    endpoints?: {
      tokenByRoomIdRole?: string;
      tokenByRoomCode?: string;
      init?: string;
      roomLayout?: string;
    };
  };
}>;

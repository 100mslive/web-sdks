import React from "react";

export declare const HMSRoomComposite: React.FC<{
  roomCode: string;
  themeConfig: {
    aspectRatio: string;
    theme: string;
    color: string;
    logo: string;
    font: string;
  };
  endPoints: {
    token?: string;
    init?: string;
  };
}>;

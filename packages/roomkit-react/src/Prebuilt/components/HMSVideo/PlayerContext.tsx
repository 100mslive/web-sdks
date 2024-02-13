import React, { useContext } from 'react';
import { HMSHLSPlayer } from '@100mslive/hls-player';

type HMSPlayeContext = {
  hlsPlayer?: HMSHLSPlayer;
};

export const HMSPlayerContext = React.createContext<HMSPlayeContext>({
  hlsPlayer: undefined,
});

export const useHMSPlayerContext = () => {
  const context = useContext(HMSPlayerContext);
  return context.hlsPlayer;
};

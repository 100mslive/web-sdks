import { createContext, useContext } from 'react';
import { HMSHLSPlayer } from '@100mslive/hls-player';

type IHMSPlayerContext = {
  hlsPlayer?: HMSHLSPlayer;
};

export const HMSPlayerContext = createContext<IHMSPlayerContext>({
  hlsPlayer: undefined,
});

export const useHMSPlayerContext = () => {
  const context = useContext(HMSPlayerContext);
  return context;
};

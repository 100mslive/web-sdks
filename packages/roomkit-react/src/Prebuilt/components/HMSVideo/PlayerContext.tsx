import React, { Dispatch, SetStateAction, useContext } from 'react';
import { HMSHLSPlayer } from '@100mslive/hls-player';

type HMSPlayeContext = {
  hlsPlayer?: HMSHLSPlayer;
  setHlsPlayer: Dispatch<SetStateAction<HMSHLSPlayer | undefined>>;
};

export const HMSPlayerContext = React.createContext<HMSPlayeContext>({
  hlsPlayer: undefined,
  setHlsPlayer: () => null,
});

export const useHMSPlayerContext = () => {
  const context = useContext(HMSPlayerContext);
  return context.hlsPlayer;
};

export const useSetHMSPlayerContext = () => {
  const context = useContext(HMSPlayerContext);
  return [context.hlsPlayer, context.setHlsPlayer];
};

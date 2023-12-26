import React, { useContext } from 'react';
// @ts-ignore
import { DEFAULT_PORTAL_CONTAINER } from './common/constants';

type HMSPrebuiltContextType = {
  roomCode: string;
  userName?: string;
  userId?: string;
  containerSelector: string;
  endpoints?: Record<string, string>;
  onLeave?: () => void;
  onJoin?: () => void;
  effectsSDKKey?: string;
};

export const HMSPrebuiltContext = React.createContext<HMSPrebuiltContextType>({
  roomCode: '',
  userName: '',
  userId: '',
  containerSelector: DEFAULT_PORTAL_CONTAINER,
  endpoints: {},
  onLeave: undefined,
  onJoin: undefined,
  effectsSDKKey: '',
});

HMSPrebuiltContext.displayName = 'HMSPrebuiltContext';

export const useHMSPrebuiltContext = () => {
  const context = useContext(HMSPrebuiltContext);
  if (!context) {
    throw Error('Make sure HMSPrebuiltContext.Provider is present at the top level of your application');
  }
  return context;
};

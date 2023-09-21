import React, { useContext } from 'react';

type HMSPrebuiltContextType = {
  roomCode: string;
  roomId?: string;
  role?: string;
  userName?: string;
  userId?: string;
  endpoints?: Record<string, string>;
  onLeave?: () => void;
};

export const HMSPrebuiltContext = React.createContext<HMSPrebuiltContextType>({
  roomCode: '',
  userName: '',
  userId: '',
  endpoints: {},
  onLeave: undefined,
});

HMSPrebuiltContext.displayName = 'HMSPrebuiltContext';

export const useHMSPrebuiltContext = () => {
  const context = useContext(HMSPrebuiltContext);
  if (!context) {
    throw Error('Make sure HMSPrebuiltContext.Provider is present at the top level of your application');
  }
  return context;
};

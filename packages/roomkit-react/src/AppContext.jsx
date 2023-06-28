import React, { useContext } from 'react';

export const HMSPrebuiltContext = React.createContext({
  showPreview: true,
  showLeave: true,
  roomId: '',
  role: '',
  roomCode: '',
  userName: '',
  userId: '',
  endPoints: {},
  onLeave: () => {},
});

HMSPrebuiltContext.displayName = 'HMSPrebuiltContext';

export const useHMSPrebuiltContext = () => {
  const context = useContext(HMSPrebuiltContext);
  if (!context) {
    throw Error(
      'Make sure AppContext.Provider is present at the top level of your application'
    );
  }
  return context;
};

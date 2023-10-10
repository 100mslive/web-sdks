import React, { useContext } from 'react';

export enum PrebuiltStates {
  MEETING = 'meeting',
  PREVIEW = 'preview',
  LEAVE = 'leave',
}

type AppStateContextType = {
  activeState?: PrebuiltStates;
  setActiveState: (state: PrebuiltStates) => void;
};

export const AppStateContext = React.createContext<AppStateContextType>({
  setActiveState: (state: PrebuiltStates) => {
    console.log('_state', state);
  },
});

AppStateContext.displayName = 'AppStateContext';

export const useHMSAppStateContext = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw Error('Make sure AppStateContext.Provider is present at the top level of your application');
  }
  return context;
};

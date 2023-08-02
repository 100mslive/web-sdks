import React from 'react';
import type { Layout } from '@100mslive/types-prebuilt';
// @ts-ignore: fix types
import { useAuthToken } from '../../components/AppData/useUISettings';
import { useFetchRoomLayout } from './hooks/useFetchRoomLayout';
import merge from 'lodash.merge';

export type RoomLayoutProviderProps = {
  roomCode: string;
  roomLayoutEndpoint?: string;
  overrideLayout?: Layout;
};

export const RoomLayoutContext = React.createContext<Layout | undefined>(undefined);

export const RoomLayoutProvider: React.FC<React.PropsWithChildren<RoomLayoutProviderProps>> = ({ children, roomLayoutEndpoint, overrideLayout }) => {
  const authToken: string = useAuthToken();
  let { layout } = useFetchRoomLayout({ authToken, endpoint: roomLayoutEndpoint });
  layout = merge(layout, overrideLayout);
  return <RoomLayoutContext.Provider value={layout}>{children}</RoomLayoutContext.Provider>;
};

export const useRoomLayout = (): Layout | undefined => React.useContext(RoomLayoutContext);

import React from 'react';
import type { Layout } from '@100mslive/types-prebuilt';
import merge from 'lodash.merge';
// @ts-ignore: fix types
import { useAuthToken } from '../../components/AppData/useUISettings';
import { useFetchRoomLayout, useFetchRoomLayoutResponse } from './hooks/useFetchRoomLayout';

export type RoomLayoutProviderProps = {
  roomLayoutEndpoint?: string;
  overrideLayout?: Partial<Layout>;
};

export const RoomLayoutContext = React.createContext<
  | {
      layout: Layout | undefined;
      updateRoomLayoutForRole: useFetchRoomLayoutResponse['updateRoomLayoutForRole'] | undefined;
    }
  | undefined
>(undefined);

export const RoomLayoutProvider: React.FC<React.PropsWithChildren<RoomLayoutProviderProps>> = ({
  children,
  roomLayoutEndpoint,
  overrideLayout,
}) => {
  const authToken: string = useAuthToken();
  const { layout, updateRoomLayoutForRole } = useFetchRoomLayout({ authToken, endpoint: roomLayoutEndpoint });
  const mergedLayout = authToken && layout ? merge(layout, overrideLayout) : layout;
  return (
    <RoomLayoutContext.Provider value={{ layout: mergedLayout, updateRoomLayoutForRole }}>
      {children}
    </RoomLayoutContext.Provider>
  );
};

export const useRoomLayout = () => React.useContext(RoomLayoutContext)?.layout;
export const useUpdateRoomLayout = () => React.useContext(RoomLayoutContext)?.updateRoomLayoutForRole;

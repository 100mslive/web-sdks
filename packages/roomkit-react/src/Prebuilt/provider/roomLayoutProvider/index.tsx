import React from 'react';
import type { Layout } from '@100mslive/types-prebuilt';
import { isArray, mergeWith } from 'lodash';
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

// The default merge in lodash merges the values of current layout and the changes.
// This behaviour makes changes in array based values inconsistent since a union happens.
// The customizer uses the new value provided if one of the values is an array
function customizer(objValue: any, srcValue: any) {
  if (isArray(objValue) || isArray(srcValue)) {
    return srcValue;
  }
  // default merge behaviour is followed
  return undefined;
}

export const RoomLayoutProvider: React.FC<React.PropsWithChildren<RoomLayoutProviderProps>> = ({
  children,
  roomLayoutEndpoint,
  overrideLayout,
}) => {
  const authToken: string = useAuthToken();
  const { layout, updateRoomLayoutForRole } = useFetchRoomLayout({ authToken, endpoint: roomLayoutEndpoint });
  const mergedLayout = authToken && layout ? mergeWith(layout, overrideLayout, customizer) : layout;
  return (
    <RoomLayoutContext.Provider value={{ layout: mergedLayout, updateRoomLayoutForRole }}>
      {children}
    </RoomLayoutContext.Provider>
  );
};

export const useRoomLayout = () => React.useContext(RoomLayoutContext)?.layout;
export const useUpdateRoomLayout = () => React.useContext(RoomLayoutContext)?.updateRoomLayoutForRole;

import React from 'react';
import { HMSRoomState, selectRoomState, useHMSStore } from '@100mslive/react-sdk';
import { ConferencingHeader } from './ConferencingHeader';
import { StreamingHeader } from './StreamingHeader';
import { isStreamingKit } from '../../common/utils';

export const Header = () => {
  const roomState = useHMSStore(selectRoomState);
  return isStreamingKit() ? (
    <StreamingHeader isPreview={roomState === HMSRoomState.Preview} />
  ) : (
    <ConferencingHeader isPreview={roomState === HMSRoomState.Preview} />
  );
};

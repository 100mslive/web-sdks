import React from 'react';
import { ConferencingHeader } from './ConferencingHeader';
import { StreamingHeader } from './StreamingHeader';
import { isStreamingKit } from '../../common/utils';
import { selectRoomState, useHMSStore, HMSRoomState } from '@100mslive/react-sdk';

export const Header = () => {
  const roomState = useHMSStore(selectRoomState);
  return isStreamingKit() ? (
    <StreamingHeader isPreview={roomState === HMSRoomState.Preview} />
  ) : (
    <ConferencingHeader isPreview={roomState === HMSRoomState.Preview} />
  );
};

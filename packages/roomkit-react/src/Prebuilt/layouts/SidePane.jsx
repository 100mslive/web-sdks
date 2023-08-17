import React from 'react';
import { selectAppData, useHMSStore } from '@100mslive/react-sdk';
import { Chat } from '../components/Chat/Chat';
import { ParticipantList } from '../components/Footer/ParticipantList';
import { StreamingLanding } from '../components/Streaming/StreamingLanding';
import { Box } from '../../Layout';
import { APP_DATA, SIDE_PANE_OPTIONS } from '../common/constants';

const SidePane = ({ css = {} }) => {
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  let ViewComponent;
  if (sidepane === SIDE_PANE_OPTIONS.PARTICIPANTS) {
    ViewComponent = ParticipantList;
  } else if (sidepane === SIDE_PANE_OPTIONS.CHAT) {
    ViewComponent = Chat;
  } else if (sidepane === SIDE_PANE_OPTIONS.STREAMING) {
    ViewComponent = StreamingLanding;
  }
  if (!ViewComponent) {
    return null;
  }
  return (
    <Box
      css={{
        w: '$100',
        h: '100%',
        p: '$10',
        bg: '$surface_dim',
        r: '$1',
        ml: '$8',
        position: 'relative',
        ...css,
        '@lg': {
          w: '100%',
          h: '100%',
          ml: 0,
          right: 0,
          position: 'fixed',
          bottom: 0,
          r: 0,
          zIndex: 10,
          ...(css['@lg'] || {}),
        },
        '@md': {
          p: '$6 $8',
          pb: '$12',
        },
      }}
    >
      <ViewComponent />
    </Box>
  );
};

export default SidePane;

import React, { useState } from 'react';
import { HandIcon, HandRaiseSlashedIcon } from '@100mslive/react-icons';
import { CSS } from '../../Theme';
import { Tooltip } from '../../Tooltip';
// @ts-ignore: No implicit Any
import IconButton from '../IconButton';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useMyMetadata } from './hooks/useMetadata';
import { Box } from '../../Layout';

export const RaiseHand = ({ css }: { css?: CSS }) => {
  const { isHandRaised, toggleHandRaise } = useMyMetadata();
  const { elements } = useRoomLayoutConferencingScreen();
  const [ ariaLiveMessage, setAriaLiveMessage ] = useState('');

  if (!elements.hand_raise) {
    return null;
  }

  return (
    <>
      <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
        <IconButton
          data-testid="hand_raise_btn"
          css={css}
          active={!isHandRaised}
          onClick={async () => {
            await toggleHandRaise();
            setAriaLiveMessage(
              isHandRaised
                ? 'Your hand is no longer raised'
                : 'Your hand is raised'
            );
          }}
        >
          <Box aria-hidden>
            {isHandRaised ? <HandRaiseSlashedIcon /> : <HandIcon />}
          </Box>
        </IconButton>
      </Tooltip>
      <Box aria-live="assertive" style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
      }}>
        {ariaLiveMessage}
      </Box>
    </>
  );
};

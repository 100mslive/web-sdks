import React, { useEffect } from 'react';
import { selectIsEffectsEnabled, selectIsLocalVideoEnabled, useHMSStore } from '@100mslive/react-sdk';
import { VirtualBackgroundIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
// @ts-ignore
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { APP_DATA, DEFAULT_VB_STATES, isSafari, SIDE_PANE_OPTIONS } from '../../common/constants';

export const VBToggle = () => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const isVBOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.VB);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const { elements } = useRoomLayoutConferencingScreen();
  const backgroundMedia = elements?.virtual_background?.background_media;
  const [defaultVBState, setDefaultVBState] = useSetAppDataByKey(APP_DATA.defaultVB);
  const isEffectsEnabled = useHMSStore(selectIsEffectsEnabled);

  useEffect(() => {
    const defaultMediaPresent = !!backgroundMedia?.some(media => media.default);

    if (defaultMediaPresent && defaultVBState === DEFAULT_VB_STATES.UNSET) {
      toggleVB();
      setDefaultVBState(DEFAULT_VB_STATES.OPENED);
    }
  }, [backgroundMedia, defaultVBState, setDefaultVBState, toggleVB]);

  if (!isVideoOn || (!isEffectsEnabled && isSafari)) {
    return null;
  }

  return (
    <Tooltip side="top" disabled={isVBOpen} title="Configure Virtual Background">
      <IconButton active={!isVBOpen} onClick={toggleVB} data-testid="virtual_bg_btn">
        <VirtualBackgroundIcon />
      </IconButton>
    </Tooltip>
  );
};

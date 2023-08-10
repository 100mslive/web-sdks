import React, { Suspense, useState } from 'react';
import { useMedia } from 'react-use';
import { selectPermissions, useHMSStore } from '@100mslive/react-sdk';
import { BrbIcon, CrossIcon, DragHandleIcon, HandIcon, MicOffIcon, PencilIcon } from '@100mslive/react-icons';
import { Box, config as cssConfig, Tooltip } from '../../../../';
import { Sheet } from '../../../../Sheet';
import IconButton from '../../../IconButton';
import { ActionTile } from '.././ActionTile';
import { ChangeNameModal } from '.././ChangeNameModal';
import { MuteAllModal } from '.././MuteAllModal';
import { useDropdownList } from '../../hooks/useDropdownList';
import { useIsFeatureEnabled } from '../../hooks/useFeatures';
import { useMyMetadata } from '../../hooks/useMetadata';
import { FEATURE_LIST } from '../../../common/constants';

const VirtualBackground = React.lazy(() => import('../../../plugins/VirtualBackground/VirtualBackground'));

const MODALS = {
  CHANGE_NAME: 'changeName',
  SELF_ROLE_CHANGE: 'selfRoleChange',
  MORE_SETTINGS: 'moreSettings',
  START_RECORDING: 'startRecording',
  DEVICE_SETTINGS: 'deviceSettings',
  STATS_FOR_NERDS: 'statsForNerds',
  BULK_ROLE_CHANGE: 'bulkRoleChange',
  MUTE_ALL: 'muteAll',
  EMBED_URL: 'embedUrl',
};

export const MwebOptions = () => {
  const permissions = useHMSStore(selectPermissions);
  const [openModals, setOpenModals] = useState(new Set());
  const { isHandRaised, isBRBOn, toggleHandRaise, toggleBRB } = useMyMetadata();
  const isHandRaiseEnabled = useIsFeatureEnabled(FEATURE_LIST.HAND_RAISE);
  const isBRBEnabled = useIsFeatureEnabled(FEATURE_LIST.BRB);

  const [openSettingsSheet, setOpenSettingsSheet] = useState(false);

  useDropdownList({ open: openModals.size > 0, name: 'MoreSettings' });

  const updateState = (modalName, value) => {
    setOpenModals(modals => {
      const copy = new Set(modals);
      if (value) {
        copy.add(modalName);
      } else {
        copy.delete(modalName);
      }
      return copy;
    });
  };
  const isMobile = useMedia(cssConfig.media.md);

  return (
    <>
      <Sheet.Root open={openSettingsSheet} onOpenChange={setOpenSettingsSheet}>
        <Sheet.Trigger asChild data-testid="more_settings_btn">
          <IconButton>
            <Tooltip title="More options">
              <DragHandleIcon />
            </Tooltip>
          </IconButton>
        </Sheet.Trigger>
        <Sheet.Content css={{ bg: '$surface_dim', pb: '$14' }}>
          <Sheet.Title
            css={{
              display: 'flex',
              color: '$on_surface_high',
              w: '100%',
              justifyContent: 'space-between',
              fontSize: '$md',
              mt: '$8',
              px: '$10',
              pb: '$8',
              borderBottom: '1px solid $border_default',
              mb: '$8',
              alignItems: 'center',
            }}
          >
            Options
            <Sheet.Close>
              <Box css={{ color: '$on_surface_high' }}>
                <CrossIcon />
              </Box>
            </Sheet.Close>
          </Sheet.Title>
          <Box
            css={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: 'auto',
              gridColumnGap: '$6',
              gridRowGap: '$8',
              px: '$9',
            }}
          >
            {isHandRaiseEnabled ? (
              <ActionTile
                title="Raise Hand"
                icon={<HandIcon />}
                onClick={toggleHandRaise}
                active={isHandRaised}
                setOpenSettingsSheet={setOpenSettingsSheet}
              />
            ) : null}
            {isBRBEnabled ? (
              <ActionTile
                title="Be Right Back"
                icon={<BrbIcon />}
                onClick={toggleBRB}
                active={isBRBOn}
                setOpenSettingsSheet={setOpenSettingsSheet}
              />
            ) : null}
            {permissions.mute ? (
              <ActionTile
                title="Mute All"
                icon={<MicOffIcon />}
                onClick={() => updateState(MODALS.MUTE_ALL, true)}
                setOpenSettingsSheet={setOpenSettingsSheet}
              />
            ) : null}
            <ActionTile
              title="Change Name"
              icon={<PencilIcon />}
              onClick={() => updateState(MODALS.CHANGE_NAME, true)}
              setOpenSettingsSheet={setOpenSettingsSheet}
            />
            <Suspense fallback="">
              <VirtualBackground asActionTile />
            </Suspense>
          </Box>
        </Sheet.Content>
      </Sheet.Root>
      {openModals.has(MODALS.MUTE_ALL) && (
        <MuteAllModal onOpenChange={value => updateState(MODALS.MUTE_ALL, value)} isMobile={isMobile} />
      )}
      {openModals.has(MODALS.CHANGE_NAME) && (
        <ChangeNameModal
          onOpenChange={value => updateState(MODALS.CHANGE_NAME, value)}
          openParentSheet={() => setOpenSettingsSheet(true)}
        />
      )}
    </>
  );
};

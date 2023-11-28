import React from 'react';
import { CaptionIcon } from '@100mslive/react-icons';
import { IconButton } from '../../../';

export function HLSCaptionSelector({ isEnabled, onClick }: { isEnabled: boolean; onClick: (show: boolean) => void }) {
  return (
    <IconButton
      css={{ borderBottom: `${isEnabled ? '2px solid $primary_default' : ''}`, p: '$2' }}
      onClick={() => onClick(!isEnabled)}
    >
      <CaptionIcon width="20" height="20px" />
    </IconButton>
  );
}

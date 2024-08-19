import React from 'react';
import { ExternalLinkIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Text } from '../../../Text';

export const PIPChatOption = ({ openChat, showPIPChat }: { openChat: () => void; showPIPChat: boolean }) => {
  if (!showPIPChat) {
    return <></>;
  }
  return (
    <Dropdown.Item onClick={openChat} data-testid="pip_chat_btn">
      <ExternalLinkIcon height={24} width={24} />
      <Text variant="sm" css={{ ml: '$4', color: '$on_surface_high' }}>
        Pop out Chat
      </Text>
    </Dropdown.Item>
  );
};

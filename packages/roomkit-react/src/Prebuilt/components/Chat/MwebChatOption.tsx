import React from 'react';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const MwebChatOption = ({
  icon,
  text,
  onClick,
  color = 'onSurface.high',
}: {
  icon: React.ReactNode;
  text: string;
  onClick: () => void | Promise<void>;
  color?: string;
}) => {
  return (
    <Flex align="center" css={{ w: '100%', color, cursor: 'pointer', gap: '4', p: '8' }} onClick={onClick}>
      {icon}
      <Text variant="sm" css={{ color, fontWeight: 'semiBold' }}>
        {text}
      </Text>
    </Flex>
  );
};

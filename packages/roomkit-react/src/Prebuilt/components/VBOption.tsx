import React from 'react';
import { Box, Flex } from '../../Layout';
import { Text } from '../../Text';
// @ts-ignore
import { VB_EFFECT } from '../common/constants';

export const VBOption = ({
  title,
  icon,
  onClick,
  mediaURL = '',
  isActive,
  type = VB_EFFECT.MEDIA,
}: {
  title?: string;
  icon?: React.JSX.Element;
  onClick?: () => Promise<void>;
  mediaURL?: string;
  isActive: boolean;
  type: string;
}) => {
  console.log(type);
  return (
    <Flex
      direction="column"
      align="center"
      css={{
        p: '$5',
        borderRadius: '$1',
        bg: '$surface_bright',
        border: `2px solid ${isActive ? '$primary_default' : '$surface_dim'}`,
        cursor: 'pointer',
        '&:hover': { border: '2px solid $primary_dim' },
        ...(mediaURL ? { height: '$20', backgroundImage: `url(${mediaURL})`, backgroundSize: 'cover' } : {}),
      }}
      onClick={async () => {
        if (onClick) {
          await onClick();
        }
      }}
    >
      {icon ? <Box css={{ color: '$on_surface_high' }}>{icon}</Box> : null}
      {title ? (
        <Text variant="xs" css={{ color: '$on_surface_medium' }}>
          {title}
        </Text>
      ) : null}
    </Flex>
  );
};

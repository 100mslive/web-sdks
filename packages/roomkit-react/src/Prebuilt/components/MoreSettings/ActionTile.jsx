import React from 'react';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { getFormattedCount } from '../../common/utils';

export const ActionTile = ({ icon, title, active, onClick, disabled = false, setOpenOptionsSheet, number = 0 }) => {
  return (
    <Flex
      direction="column"
      align="center"
      onClick={() => {
        if (!disabled) {
          onClick();
          setOpenOptionsSheet(false);
        }
      }}
      css={{
        p: '$4 $2',
        position: 'relative',
        bg: active ? '$surface_bright' : '',
        color: disabled ? '$on_surface_low' : '$on_surface_high',
        gap: '$4',
        r: '$1',
        '&:hover': {
          bg: '$surface_bright',
        },
      }}
    >
      {number ? (
        <Text
          variant="tiny"
          css={{
            position: 'absolute',
            top: 0,
            right: 0,
            fontWeight: '$semiBold',
            color: '$on_surface_high',
            p: '$2',
            bg: '$surface_bright',
            r: '$round',
          }}
        >
          {getFormattedCount(number)}
        </Text>
      ) : null}
      {icon}
      <Text variant="xs" css={{ fontWeight: '$semiBold', color: 'inherit', textAlign: 'center' }}>
        {title}
      </Text>
    </Flex>
  );
};

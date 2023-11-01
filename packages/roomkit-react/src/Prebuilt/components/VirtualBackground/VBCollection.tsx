import React from 'react';
import { Box } from '../../../Layout';
import { Text } from '../../../Text';
import { VBOption } from './VBOption';
import { VB_EFFECT } from './constants';

export const VBCollection = ({
  options,
  title,
  activeBackgroundType = '',
  activeBackground = '',
}: {
  options: {
    title?: string;
    icon?: React.JSX.Element;
    onClick?: () => Promise<void>;
    mediaURL?: string;
    type: string;
  }[];
  title: string;
  activeBackground: HTMLImageElement | string;
  activeBackgroundType: string;
}) => {
  if (options.length === 0) {
    return null;
  }
  return (
    <Box css={{ my: '$10' }}>
      <Text variant="sm" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
        {title}
      </Text>
      <Box css={{ py: '$4', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '$8' }}>
        {options.map(option => (
          <VBOption.Root
            key={option?.mediaURL || option?.title}
            {...option}
            isActive={
              ([VB_EFFECT.NONE, VB_EFFECT.BLUR].includes(activeBackgroundType) &&
                option.type === activeBackgroundType) ||
              activeBackground === option?.mediaURL
            }
          >
            <VBOption.Icon>{option?.icon}</VBOption.Icon>
            <VBOption.Title>{option?.title}</VBOption.Title>
          </VBOption.Root>
        ))}
      </Box>
    </Box>
  );
};

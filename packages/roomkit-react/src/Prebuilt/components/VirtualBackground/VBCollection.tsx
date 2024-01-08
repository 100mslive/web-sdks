import React from 'react';
import { HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';
import { Box } from '../../../Layout';
import { Text } from '../../../Text';
import { VBOption } from './VBOption';

export const VBCollection = ({
  options,
  title,
  activeBackground = '',
}: {
  options: {
    title?: string;
    icon?: React.JSX.Element;
    onClick?: () => Promise<void>;
    mediaURL?: string;
    value: string | HMSVirtualBackgroundTypes;
  }[];
  title: string;
  activeBackground: string;
}) => {
  if (options.length === 0) {
    return null;
  }
  return (
    <Box css={{ mt: '$10' }}>
      <Text variant="sm" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
        {title}
      </Text>
      <Box css={{ py: '$4', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '$8' }}>
        {options.map((option, index) => (
          <VBOption.Root
            key={option.value}
            testid={option.value === HMSVirtualBackgroundTypes.IMAGE ? `virtual_bg_option-${index}` : option.value}
            {...option}
            isActive={activeBackground === option.value}
          >
            <VBOption.Icon>{option?.icon}</VBOption.Icon>
            <VBOption.Title>{option?.title}</VBOption.Title>
          </VBOption.Root>
        ))}
      </Box>
    </Box>
  );
};
